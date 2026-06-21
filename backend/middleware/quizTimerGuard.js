import models from "../models/index.js";

const { QuizAttempt } = models;

export default async function quizTimerGuard(req, res, next) {
  try {
    const attemptId = req.params?.attemptId || req.body?.attemptId;

    if (!attemptId) return next();

   

    const attempt = await QuizAttempt.findByPk(attemptId);
    if (!attempt || attempt.status === "completed") return next();

    const now = new Date();
    const elapsed = Math.floor((now - attempt.startedAt) / 1000);

    if (elapsed >= attempt.timeLimitSeconds) {
      attempt.status = "completed";
      attempt.autoSubmitted = true;
      attempt.submittedAt = new Date();
      attempt.timeSpentSeconds = attempt.timeLimitSeconds;
      await attempt.save();

      return res.status(403).json({
        message: "Time expired. Quiz auto-submitted.",
        autoSubmitted: true,
      });
    }

    attempt.timeSpentSeconds = elapsed;
    await attempt.save();

    next();
  } catch (err) {
    console.error(err);
    next();
  }
}
