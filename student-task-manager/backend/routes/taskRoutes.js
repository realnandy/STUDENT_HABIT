const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { subject, priority, status, sort } = req.query;
    
    const filter = { userId: req.userId };
    
    if (subject && subject !== 'All') {
      filter.subject = subject;
    }
    if (priority && priority !== 'All') {
      filter.priority = priority;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }

    let sortOption = { deadline: 1 };
    if (sort === 'priority') {
      sortOption = { priority: -1, deadline: 1 };
    } else if (sort === 'createdAt') {
      sortOption = { createdAt: -1 };
    }

    const tasks = await Task.find(filter).sort(sortOption);
    
    res.json({ tasks, count: tasks.length });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, subject, priority, deadline } = req.body;

    if (!title || !subject || !deadline) {
      return res.status(400).json({ message: 'Please provide title, subject, and deadline' });
    }

    const task = new Task({
      userId: req.userId,
      title,
      description,
      subject,
      priority: priority || 'Medium',
      deadline: new Date(deadline)
    });

    await task.save();

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, priority, deadline, status } = req.body;

    const task = await Task.findOne({ _id: id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (subject) task.subject = subject;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = new Date(deadline);
    if (status) task.status = status;

    await task.save();

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error updating task', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({ _id: id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error deleting task', error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ userId: req.userId });
    const completedTasks = await Task.countDocuments({ userId: req.userId, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ userId: req.userId, status: 'Pending' });
    const overdueTasks = await Task.countDocuments({ 
      userId: req.userId, 
      status: 'Pending',
      deadline: { $lt: new Date() }
    });

    const subjects = await Task.distinct('subject', { userId: req.userId });
    const subjectStats = {};
    
    for (const subject of subjects) {
      const count = await Task.countDocuments({ userId: req.userId, subject });
      const completed = await Task.countDocuments({ userId: req.userId, subject, status: 'Completed' });
      subjectStats[subject] = { total: count, completed };
    }

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      subjectStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats', error: error.message });
  }
});

module.exports = router;
