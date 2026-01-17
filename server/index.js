import { paymongoCreateCheckoutSession } from "./paymongo.js";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { makeDbPool } from "./db.js";

import { clerkMiddleware, getAuth, clerkClient } from "@clerk/express";

const app = express();
const db = makeDbPool();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) || true,
    credentials: true,
  })
);

app.post("/webhooks/paymongo", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    // 1) Verify signature (recommended)
    // This depends on PayMongo’s exact signature format in their “Webhook best practices” doc. :contentReference[oaicite:4]{index=4}
    // Implement verification according to the header they send + your PAYMONGO_WEBHOOK_SECRET.

    // If you want a quick start while testing locally, you can temporarily skip verification:
    // (BUT turn it back on before production)
    const event = JSON.parse(req.body.toString("utf8"));

    const eventType = event?.data?.attributes?.type;
    const resource = event?.data?.attributes?.data;

    // We care about successful checkout payment
    if (eventType === "checkout_session.payment.paid") {
      const checkoutId = resource?.id; // checkout session id
      const paymentId = resource?.attributes?.payments?.[0]?.id || null;

      if (!checkoutId) return res.status(400).json({ error: "Missing checkout id" });

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // Find donation by checkout id
        const [dRows] = await conn.query(
          `SELECT id, animal_id, amount, status
           FROM donations
           WHERE paymongo_checkout_id = ?
           FOR UPDATE`,
          [checkoutId]
        );
        if (!dRows.length) {
          await conn.rollback();
          conn.release();
          return res.status(200).json({ ok: true }); // ignore unknown
        }

        const d = dRows[0];
        if (d.status !== "paid") {
          // Mark donation paid
          await conn.query(
            `UPDATE donations
             SET status='paid', paymongo_payment_id=?
             WHERE id=?`,
            [paymentId, d.id]
          );

          // Increase raised
          await conn.query(
            `UPDATE animals
             SET raised_amount = COALESCE(raised_amount, 0) + ?
             WHERE id = ?`,
            [Number(d.amount), d.animal_id]
          );

          await maybeCompleteGoalAndNotify(conn, d.animal_id);
        }

        await conn.commit();
      } catch (e) {
        await conn.rollback().catch(() => {});
        console.error(e);
      } finally {
        conn.release();
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid webhook payload" });
  }
});

app.use(express.json());
app.use(clerkMiddleware());

// Auth helpers
async function requireAuthApi(req, res, next) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

async function requireAdmin(req, res, next) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await clerkClient.users.getUser(userId);
  const role = user?.publicMetadata?.role;

  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden (admin only)" });
  }

  req.userId = userId;
  next();
}

// Helpers: status + notifications
async function maybeCompleteGoalAndNotify(conn, animalId) {
  // Lock row so concurrent updates don't break totals
  const [rows] = await conn.query(
    `SELECT id, category, status, goal_amount AS goal, raised_amount AS raised
     FROM animals
     WHERE id = ?
     FOR UPDATE`,
    [animalId]
  );

  if (!rows.length) return;
  const a = rows[0];

  // Only donation animals have a goal
  if (a.category !== "donate") return;

  const goal = Number(a.goal || 0);
  const raised = Number(a.raised || 0);

  // If goal reached and not completed/finalized yet -> mark completed + notify
  if (goal > 0 && raised >= goal && a.status === "active") {
    await conn.query(
      `UPDATE animals
       SET status = 'completed', completed_at = NOW()
       WHERE id = ?`,
      [animalId]
    );

    await conn.query(
      `INSERT INTO notifications (type, animal_id, message)
       VALUES (?, ?, ?)`,
      ["GOAL_REACHED", animalId, `Goal Reached for animal #${animalId}`]
    );
  }
}

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/health/db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS ok");
    res.json({ ok: true, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      code: err?.code,
      message: err?.message,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      db: process.env.DB_NAME,
    });
  }
});

// Animals (Public read)
app.get("/api/animals", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        category,
        status,
        name,
        gender,
        breed,
        age,
        shelter,
        medical_needs AS medicalNeeds,
        about,
        fb_link AS fbLink,
        image_url AS imageUrl,
        receipt_url AS receiptUrl,
        goal_amount AS goal,
        raised_amount AS raised,
        completed_at AS completedAt,
        finalized_at AS finalizedAt
      FROM animals
      ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load animals" });
  }
});

app.get("/api/animals/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        category,
        status,
        name,
        gender,
        breed,
        age,
        shelter,
        medical_needs AS medicalNeeds,
        about,
        fb_link AS fbLink,
        image_url AS imageUrl,
        receipt_url AS receiptUrl,
        goal_amount AS goal,
        raised_amount AS raised,
        completed_at AS completedAt,
        finalized_at AS finalizedAt
      FROM animals
      WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load animal" });
  }
});

// Donations (Public transparency)
// Only PAID donations are visible publicly
app.get("/api/animals/:id/donations", async (req, res) => {
  try {
    const animalId = Number(req.params.id);
    if (!Number.isFinite(animalId)) return res.status(400).json({ error: "Invalid id" });

    const [rows] = await db.query(
      `SELECT
        id,
        COALESCE(NULLIF(TRIM(donor_name), ''), 'Anonymous') AS donorName,
        amount,
        created_at AS createdAt
      FROM donations
      WHERE animal_id = ? AND status = 'paid'
      ORDER BY created_at DESC`,
      [animalId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load donations" });
  }
});

// Donations (Signed-in user)
/*
app.post("/api/animals/:id/donations", requireAuthApi, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const animalId = Number(req.params.id);
    if (!Number.isFinite(animalId)) return res.status(400).json({ error: "Invalid id" });

    const { donorName, isAnonymous, amount } = req.body || {};
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const anon =
      isAnonymous === true ||
      isAnonymous === "true" ||
      isAnonymous === 1 ||
      isAnonymous === "1";

    const cleanName = String(donorName || "").trim();
    if (!anon && !cleanName) {
      return res.status(400).json({ error: "Donor name is required unless anonymous" });
    }

    await conn.beginTransaction();

    // Lock animal row + read goal/raised/status
    const [rows] = await conn.query(
      `SELECT id, category, status, goal_amount AS goal, raised_amount AS raised
       FROM animals
       WHERE id = ?
       FOR UPDATE`,
      [animalId]
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: "Animal not found" });
    }

    const a = rows[0];
    if (a.category !== "donate") {
      await conn.rollback();
      return res.status(400).json({ error: "Donations only apply to donate animals" });
    }

    const goal = Number(a.goal || 0);
    const raised = Number(a.raised || 0);

    const add = goal > 0 ? Math.max(0, Math.min(amt, goal - raised)) : amt;
    const newRaised = goal > 0 ? Math.min(goal, raised + add) : raised + add;

    // Insert donation row 
    const { userId } = getAuth(req);

    const [ins] = await conn.query(
      `INSERT INTO donations
        (animal_id, clerk_user_id, donor_name, amount, status, paymongo_checkout_id, paymongo_payment_id)
       VALUES (?, ?, ?, ?, 'paid', NULL, NULL)`,
      [animalId, userId || null, anon ? null : cleanName, add]
    );

    // Update animal totals
    await conn.query(
      `UPDATE animals
       SET raised_amount = ?
       WHERE id = ?`,
      [newRaised, animalId]
    );

    // Mark completed
    await maybeCompleteGoalAndNotify(conn, animalId);

    await conn.commit();

    res.status(201).json({
      id: ins.insertId,
      animalId,
      amount: add,
      donorName: anon ? "Anonymous" : cleanName,
      status: "paid",
      newRaised,
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error(err);
    res.status(500).json({ error: "Failed to create donation" });
  } finally {
    conn.release();
  }
});
*/

// Donations with PayMongo 
app.post("/api/animals/:id/paymongo/checkout", requireAuthApi, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const animalId = Number(req.params.id);
    if (!Number.isFinite(animalId)) return res.status(400).json({ error: "Invalid id" });

    const { donorName, isAnonymous, amount } = req.body || {};
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: "Invalid amount" });

    const anon =
      isAnonymous === true ||
      isAnonymous === "true" ||
      isAnonymous === 1 ||
      isAnonymous === "1";

    const cleanName = String(donorName || "").trim();
    if (!anon && !cleanName) {
      return res.status(400).json({ error: "Donor name is required unless anonymous" });
    }

    const { userId } = getAuth(req);

    await conn.beginTransaction();

    // Lock animal
    const [rows] = await conn.query(
      `SELECT id, category, status, goal_amount AS goal, raised_amount AS raised, name
       FROM animals
       WHERE id = ?
       FOR UPDATE`,
      [animalId]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: "Animal not found" });
    }

    const a = rows[0];
    if (a.category !== "donate") {
      await conn.rollback();
      return res.status(400).json({ error: "Donations only apply to donate animals" });
    }
    if (a.status !== "active") {
      await conn.rollback();
      return res.status(400).json({ error: "This donation is no longer active" });
    }

    const goal = Number(a.goal || 0);
    const raised = Number(a.raised || 0);

    // cap to remaining
    const add = goal > 0 ? Math.max(0, Math.min(amt, goal - raised)) : amt;
    if (add <= 0) {
      await conn.rollback();
      return res.status(400).json({ error: "Goal already reached" });
    }

    // Create donation row as pending
    const [ins] = await conn.query(
      `INSERT INTO donations (animal_id, clerk_user_id, donor_name, amount, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [animalId, userId, anon ? null : cleanName, add]
    );

    // Create PayMongo checkout
    const checkout = await paymongoCreateCheckoutSession({
      secretKey: process.env.PAYMONGO_SECRET_KEY,
      payload: {
        description: `Donation for ${a.name}`,
        line_items: [
          {
            name: `Donation for ${a.name}`,
            amount: add * 100, // centavos
            currency: "PHP",
            quantity: 1,
          },
        ],
        payment_method_types: ["gcash", "card"],
        success_url: `${process.env.APP_URL}/animals?tab=donate`,
        cancel_url: `${process.env.APP_URL}/animals?tab=donate`,
        metadata: {
          donationId: String(ins.insertId),
          animalId: String(animalId),
        },
      },
    });

    const checkoutId = checkout?.data?.id;
    const checkoutUrl = checkout?.data?.attributes?.checkout_url;

    if (!checkoutId || !checkoutUrl) {
      throw new Error("PayMongo returned no checkout URL");
    }

    // Save checkout id in donation
    await conn.query(
      `UPDATE donations SET paymongo_checkout_id = ? WHERE id = ?`,
      [checkoutId, ins.insertId]
    );

    await conn.commit();

    // Send URL to frontend for redirect
    res.status(201).json({
      donationId: ins.insertId,
      checkoutUrl,
      amount: add,
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error(err);
    res.status(500).json({ error: err?.message || "Failed to create checkout" });
  } finally {
    conn.release();
  }
});

// Donations (Admin testing helper)
// Creates a PAID donation immediately and updates totals/status.
app.post("/api/admin/animals/:id/donations/paid", requireAdmin, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const animalId = Number(req.params.id);
    const { donorName, amount } = req.body || {};

    const amt = Number(amount);
    if (!Number.isFinite(animalId)) return res.status(400).json({ error: "Invalid id" });
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: "Invalid amount" });

    await conn.beginTransaction();

    // insert donation
    await conn.query(
      `INSERT INTO donations (animal_id, donor_name, amount, status)
       VALUES (?, ?, ?, 'paid')`,
      [animalId, donorName || null, amt]
    );

    // add to raised
    await conn.query(
      `UPDATE animals
       SET raised_amount = COALESCE(raised_amount, 0) + ?
       WHERE id = ?`,
      [amt, animalId]
    );

    // maybe mark completed + notify
    await maybeCompleteGoalAndNotify(conn, animalId);

    await conn.commit();

    // return updated animal
    const [rows] = await db.query(
      `SELECT
        id, category, status, name, gender, breed, age, shelter,
        medical_needs AS medicalNeeds,
        about,
        fb_link AS fbLink,
        image_url AS imageUrl,
        receipt_url AS receiptUrl,
        goal_amount AS goal,
        raised_amount AS raised,
        completed_at AS completedAt,
        finalized_at AS finalizedAt
      FROM animals
      WHERE id = ?`,
      [animalId]
    );

    res.status(201).json({ ok: true, animal: rows[0] });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error(err);
    res.status(500).json({ error: "Failed to add paid donation" });
  } finally {
    conn.release();
  }
});

// Admin Notifications
app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        type,
        animal_id AS animalId,
        message,
        read_at AS readAt,
        created_at AS createdAt
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

app.patch("/api/admin/notifications/:id/read", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const [r] = await db.query(
      `UPDATE notifications SET read_at = NOW() WHERE id = ?`,
      [id]
    );

    if (r.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

//Finalize receipts
app.post("/api/admin/animals/:id/receipt", requireAdmin, async (req, res) => {
  try {
    const animalId = Number(req.params.id);
    const { receiptUrl } = req.body || {};

    if (!Number.isFinite(animalId)) return res.status(400).json({ error: "Invalid id" });
    if (!String(receiptUrl || "").trim()) return res.status(400).json({ error: "receiptUrl is required" });

    // Only finalize donation animals; must be completed OR already finalized
    const [rows] = await db.query(
      `SELECT id, category, status FROM animals WHERE id = ?`,
      [animalId]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });

    const a = rows[0];
    if (a.category !== "donate") {
      return res.status(400).json({ error: "Receipt is only for donate animals" });
    }
    if (a.status !== "completed" && a.status !== "finalized") {
      return res.status(400).json({ error: "Animal must be completed before finalizing" });
    }

    await db.query(
      `UPDATE animals
       SET receipt_url = ?, status = 'finalized', finalized_at = NOW()
       WHERE id = ?`,
      [String(receiptUrl).trim(), animalId]
    );

    const [updated] = await db.query(
      `SELECT
        id,
        category,
        status,
        name,
        receipt_url AS receiptUrl,
        goal_amount AS goal,
        raised_amount AS raised,
        completed_at AS completedAt,
        finalized_at AS finalizedAt
      FROM animals
      WHERE id = ?`,
      [animalId]
    );

    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to finalize receipt" });
  }
});

// CREATE (admin)
app.post("/api/animals", requireAdmin, async (req, res) => {
  try {
    const {
      category,
      name,
      gender,
      breed,
      age,
      shelter,
      medicalNeeds,
      about,
      fbLink,
      imageUrl,
      goal,
      raised,
    } = req.body || {};

    // shared required
    if (!category || !["donate", "adopt"].includes(category))
      return res.status(400).json({ error: "Invalid category" });

    if (!String(name || "").trim()) return res.status(400).json({ error: "Name is required" });
    if (!String(gender || "").trim()) return res.status(400).json({ error: "Gender is required" });
    if (!String(breed || "").trim()) return res.status(400).json({ error: "Breed is required" });
    if (!String(age || "").trim()) return res.status(400).json({ error: "Age is required" });
    if (!String(shelter || "").trim()) return res.status(400).json({ error: "Shelter is required" });
    if (!String(imageUrl || "").trim()) return res.status(400).json({ error: "Image URL is required" });

    let goalAmount = null;
    let raisedAmount = null;
    let med = null;
    let aboutText = null;
    let fb = null;

    if (category === "donate") {
      if (!String(medicalNeeds || "").trim())
        return res.status(400).json({ error: "Medical needs is required for donate" });

      const g = Number(goal);
      if (!Number.isFinite(g) || g <= 0)
        return res.status(400).json({ error: "Goal must be a positive number" });

      // raised optional (defaults 0)
      const r =
        raised === undefined || raised === null || String(raised).trim() === ""
          ? 0
          : Number(raised);

      if (!Number.isFinite(r) || r < 0)
        return res.status(400).json({ error: "Raised must be 0 or more" });

      goalAmount = g;
      raisedAmount = Math.min(r, g);
      med = String(medicalNeeds).trim();
      aboutText = null;
      fb = null;
    } else {
      if (!String(about || "").trim())
        return res.status(400).json({ error: "About is required for adopt" });
      if (!String(fbLink || "").trim())
        return res.status(400).json({ error: "Facebook link is required for adopt" });

      aboutText = String(about).trim();
      fb = String(fbLink).trim();
      med = null;
      goalAmount = null;
      raisedAmount = null;
    }

    const [result] = await db.query(
      `INSERT INTO animals
        (category, status, name, gender, breed, age, shelter, medical_needs, about, fb_link, image_url, goal_amount, raised_amount)
       VALUES (?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category,
        String(name).trim(),
        String(gender).trim(),
        String(breed).trim(),
        String(age).trim(),
        String(shelter).trim(),
        med,
        aboutText,
        fb,
        String(imageUrl).trim(),
        goalAmount,
        raisedAmount,
      ]
    );

    // if created with raised already reaching goal, mark completed + notify
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await maybeCompleteGoalAndNotify(conn, result.insertId);
      await conn.commit();
    } catch {
      await conn.rollback().catch(() => {});
    } finally {
      conn.release();
    }

    const [rows] = await db.query(
      `SELECT
        id, category, status, name, gender, breed, age, shelter,
        medical_needs AS medicalNeeds,
        about,
        fb_link AS fbLink,
        image_url AS imageUrl,
        receipt_url AS receiptUrl,
        goal_amount AS goal,
        raised_amount AS raised,
        completed_at AS completedAt,
        finalized_at AS finalizedAt
      FROM animals
      WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create animal" });
  }
});

// UPDATE (admin)
app.put("/api/animals/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    const {
      category,
      name,
      gender,
      breed,
      age,
      shelter,
      medicalNeeds,
      about,
      fbLink,
      imageUrl,
      goal,
      raised,
    } = req.body || {};

    if (!category || !["donate", "adopt"].includes(category))
      return res.status(400).json({ error: "Invalid category" });

    if (!String(name || "").trim()) return res.status(400).json({ error: "Name is required" });
    if (!String(gender || "").trim()) return res.status(400).json({ error: "Gender is required" });
    if (!String(breed || "").trim()) return res.status(400).json({ error: "Breed is required" });
    if (!String(age || "").trim()) return res.status(400).json({ error: "Age is required" });
    if (!String(shelter || "").trim()) return res.status(400).json({ error: "Shelter is required" });
    if (!String(imageUrl || "").trim()) return res.status(400).json({ error: "Image URL is required" });

    let goalAmount = null;
    let raisedAmount = null;
    let med = null;
    let aboutText = null;
    let fb = null;

    if (category === "donate") {
      if (!String(medicalNeeds || "").trim())
        return res.status(400).json({ error: "Medical needs is required for donate" });

      const g = Number(goal);
      if (!Number.isFinite(g) || g <= 0)
        return res.status(400).json({ error: "Goal must be a positive number" });

      const r = raised === undefined || raised === null ? 0 : Number(raised);
      if (!Number.isFinite(r) || r < 0)
        return res.status(400).json({ error: "Raised must be 0 or more" });

      goalAmount = g;
      raisedAmount = Math.min(r, g);
      med = String(medicalNeeds).trim();
      aboutText = null;
      fb = null;
    } else {
      if (!String(about || "").trim())
        return res.status(400).json({ error: "About is required for adopt" });
      if (!String(fbLink || "").trim())
        return res.status(400).json({ error: "Facebook link is required for adopt" });

      aboutText = String(about).trim();
      fb = String(fbLink).trim();
      med = null;
      goalAmount = null;
      raisedAmount = null;
    }

    const [result] = await db.query(
      `UPDATE animals
       SET
         category = ?,
         name = ?,
         gender = ?,
         breed = ?,
         age = ?,
         shelter = ?,
         medical_needs = ?,
         about = ?,
         fb_link = ?,
         image_url = ?,
         goal_amount = ?,
         raised_amount = ?
       WHERE id = ?`,
      [
        category,
        String(name).trim(),
        String(gender).trim(),
        String(breed).trim(),
        String(age).trim(),
        String(shelter).trim(),
        med,
        aboutText,
        fb,
        String(imageUrl).trim(),
        goalAmount,
        raisedAmount,
        id,
      ]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });

    // if updated values now reach goal, mark completed + notify
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await maybeCompleteGoalAndNotify(conn, id);
      await conn.commit();
    } catch {
      await conn.rollback().catch(() => {});
    } finally {
      conn.release();
    }

    const [rows] = await db.query(
      `SELECT
        id, category, status, name, gender, breed, age, shelter,
        medical_needs AS medicalNeeds,
        about,
        fb_link AS fbLink,
        image_url AS imageUrl,
        receipt_url AS receiptUrl,
        goal_amount AS goal,
        raised_amount AS raised,
        completed_at AS completedAt,
        finalized_at AS finalizedAt
      FROM animals
      WHERE id = ?`,
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update animal" });
  }
});

// DELETE (admin)
app.delete("/api/animals/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    const [result] = await db.query(`DELETE FROM animals WHERE id = ?`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete animal" });
  }
});



const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
