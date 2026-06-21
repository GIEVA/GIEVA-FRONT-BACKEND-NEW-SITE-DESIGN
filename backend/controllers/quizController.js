import models from "../models/index.js";
import { getNextDifficulty } from "../utils/adaptiveEngine.js";
import quizTimerGuard from "../middleware/quizTimerGuard.js";

const { Quiz, Question, QuizAttempt, QuizAnswer, Payment } = models;

//
// ================= CREATE QUIZ =================
//
export const createQuiz = async (req, res) => {
  try {
    const { courseId, title, description, durationMinutes, totalMarks, isPaid, price } = req.body;

    const course = await models.Course.findByPk(courseId);

      if (!course) {
        return res.status(404).json({
          message: "Course not found",
        });
      }
    const quiz = await Quiz.create({
      courseId,
      title,
      description,
      durationMinutes,
      totalMarks,
      isPaid,
      price,
    });

    return res.status(201).json({ message: "Quiz created", quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


//
// ================= ADD QUESTION =================
//
export const addQuestion = async (req, res) => {
  try {
    const { quizId } = req.params;

    const {
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      marks,
    } = req.body;

    const question = await Question.create({
      quizId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      marks,
    });

    return res.status(201).json({ message: "Question added", question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


//
// ================= START QUIZ =================
//
export const startQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quizId } = req.params;

    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // // ===== CHECK PAYMENT IF QUIZ IS PAID =====
    // if (quiz.isPaid) {
    //   const payment = await Payment.findOne({
    //     where: { userId, quizId, status: "success" },
    //   });

    //   if (!payment) {
    //     return res.status(403).json({ message: "Quiz locked. Payment required." });
    //   }
    // }

    // ===== CHECK EXISTING ATTEMPT =====
    let attempt = await QuizAttempt.findOne({
      where: { quizId, userId, status: "in_progress" },
    });

    await models.ActivityLog.create({
              userId,
              action: "QUIZ_STARTED",
              meta: { quizId },
            });

    if (!attempt) {
      attempt = await QuizAttempt.create({
        quizId,
        userId,
        totalMarks: quiz.totalMarks,
        startedAt: new Date(),
        timeLimitSeconds: quiz.durationMinutes * 60,

      });
    }

    const questions = await Question.findAll({
      where: { quizId },
      attributes: { exclude: ["correctAnswer"] }, // hide answers
    });

    return res.json({
      message: "Quiz started",
      attemptId: attempt.id,
      durationMinutes: quiz.durationMinutes,
      questions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



// ================= GET QUIZZES BY COURSE =================
export const getQuizzesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const quizzes = await Quiz.findAll({
      where: { courseId },
      attributes: [
        "id",
        "title",
        "description",
        "durationMinutes",
        "totalMarks",
        "isPaid",
        "price",
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(quizzes);
  } catch (err) {
    console.error("Get Quizzes Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET SINGLE QUIZ =================
export const getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findByPk(quizId, {
      include: [
        {
          model: Question,
          attributes: { exclude: ["correctAnswer"] }, // don't expose answers
        },
      ],
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    return res.json(quiz);
  } catch (err) {
    console.error("Get Quiz Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
//
// ================= SUBMIT QUIZ =================
//
export const submitQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const { attemptId } = req.params;
    const { answers } = req.body;

    const attempt = await QuizAttempt.findByPk(attemptId);

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    if (attempt.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (attempt.status === "completed") {
      return res.status(400).json({ message: "Already submitted" });
    }

    const quiz = await Quiz.findByPk(attempt.quizId);

    const now = new Date();
    const endTime = new Date(
      attempt.startedAt.getTime() + quiz.durationMinutes * 60000
    );

    if (now > endTime) {
      attempt.status = "timeout";
      await attempt.save();
      return quizTimerGuard(req, res);
    }

    // bulk fetch
    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.findAll({
      where: { id: questionIds },
    });

    const map = {};
    questions.forEach(q => (map[q.id] = q));

    let score = 0;

    // remove old answers
    await QuizAnswer.destroy({ where: { attemptId } });

    for (const ans of answers) {
      const q = map[ans.questionId];
      if (!q) continue;

      const isCorrect = q.correctAnswer === ans.selectedAnswer;

      if (isCorrect) score += q.marks;

      await models.ActivityLog.create({
        userId,
        action: "QUIZ_SUBMITTTED",
        meta: { quizId },
      });

      await QuizAnswer.create({
        attemptId,
        questionId: q.id,
        selectedAnswer: ans.selectedAnswer,
        isCorrect,
      });
    }

    attempt.score = score;
    attempt.status = "completed";
    attempt.submittedAt = new Date();
    await attempt.save();

    return res.json({
      score,
      totalMarks: attempt.totalMarks,
      percentage: ((score / attempt.totalMarks) * 100).toFixed(2),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


//
// ================= GET RESULT =================
//
export const getQuizResult = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await QuizAttempt.findByPk(attemptId, {
      include: [
        {
          model: QuizAnswer,
          include: [Question],
        },
      ],
    });

    if (!attempt) return res.status(404).json({ message: "Result not found" });

    return res.json(attempt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


//
// ================= RESUME QUIZ =================
//
export const resumeQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quizId } = req.params;

    const attempt = await QuizAttempt.findOne({
      where: { quizId, userId, status: "in_progress" },
    });

    if (!attempt) {
      return res.status(404).json({ message: "No active attempt" });
    }

    const questions = await Question.findAll({
      where: { quizId },
      attributes: { exclude: ["correctAnswer"] },
    });

    return res.json({
      attemptId: attempt.id,
      questions,
      startedAt: attempt.startedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getRemainingTime = async (req, res) => {
  const { attemptId } = req.params;

  const attempt = await QuizAttempt.findByPk(attemptId);
  if (!attempt) return res.status(404).json({ message: "Not found" });

  const elapsed = Math.floor((new Date() - attempt.startedAt) / 1000);
  const remaining = Math.max(attempt.timeLimitSeconds - elapsed, 0);

  res.json({ remainingSeconds: remaining });
};



export const getNextQuestionAdaptive = async (req, res) => {
  const { attemptId, lastCorrect, lastDifficulty } = req.body;

  const nextDifficulty = getNextDifficulty(lastDifficulty, lastCorrect);

  const question = await Question.findOne({
    where: { difficulty: nextDifficulty },
    order: [["RAND()"]],
  });

  res.json({ question, nextDifficulty });
};
