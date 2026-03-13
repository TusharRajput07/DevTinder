const express = require("express");
const Groq = require("groq-sdk");
const { userAuth } = require("../middlewares/auth");

const aiRouter = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// generate a bio based on user's skills and hobbies
aiRouter.post("/ai/generate-bio", userAuth, async (req, res) => {
  try {
    const { skills, hobbies, firstName } = req.body;

    if (!skills && !hobbies) {
      return res
        .status(400)
        .json({ message: "Please fill in your skills or hobbies first." });
    }

    const prompt = `Write a very short casual bio for a user named ${firstName || "a developer"} for a dev networking app.
Their skills: ${skills || "not specified"}
Their hobbies: ${hobbies || "not specified"}

Requirements:
- Max 1 sentence, punchy and fun
- Casual, like a real person wrote it — NOT formal or corporate
- No buzzwords like "passionate", "enthusiastic", "dedicated"
- No emojis, no hashtags, no quotes
- First person
- Return ONLY the bio, nothing else`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.8,
    });

    const bio = completion.choices[0]?.message?.content?.trim();
    res.json({ bio });
  } catch (err) {
    console.error("Groq bio error:", err.message);
    res.status(500).json({ message: "Failed to generate bio." });
  }
});

// generate icebreaker messages based on the other person's profile
aiRouter.post("/ai/icebreaker", userAuth, async (req, res) => {
  try {
    const { targetFirstName, targetSkills, targetHobbies, targetBio } =
      req.body;

    const prompt = `Generate exactly 3 short, fun and genuine opening messages to send to a developer named ${targetFirstName} on a developer networking app.
Their profile:
- Skills: ${targetSkills || "not specified"}
- Hobbies: ${targetHobbies || "not specified"}
- Bio: ${targetBio || "not specified"}

Requirements:
- Each message should be 1 sentence max
- Friendly, natural, not cringe or overly formal
- Reference something specific from their profile
- Do NOT number them
- Return each message on a new line
- Return ONLY the 3 messages, nothing else`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.9,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    const suggestions = raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    res.json({ suggestions });
  } catch (err) {
    console.error("Groq icebreaker error:", err.message);
    res.status(500).json({ message: "Failed to generate icebreakers." });
  }
});

module.exports = aiRouter;
