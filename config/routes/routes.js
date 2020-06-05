var express = require('express');
var router = express.Router();
var homeController = require('../../app/controllers/homeController');
var topicController = require('../../app/controllers/topicController');
var studentCsvController = require('../../app/controllers/studentCsvImporter');
var studentsController = require('../../app/controllers/studentsController');
var exerciseController = require('../../app/controllers/exerciseController');

// Handle index request
router.get('/', homeController.index);

// Handle index request with error
router.get('/err/:errMsg', homeController.index);

// Get topic
router.get('/topic/:orderNumber', topicController.getTopic);

// Update topic content
router.put('/topic/:orderNumber', topicController.updateTopicContent);

// Update topics order
router.post('/topics-reorder', topicController.updateTopicsOrder);

// Create topic
router.post('/topic', topicController.createTopic);

// Update topic's name
router.put('/topic', topicController.updateTopicTitle);

// Delete topic
router.delete('/topic', topicController.deleteTopic);

// Upload .csv for students import
router.post('/import-students', studentCsvController.importStudents);

// Get all students or search results if req.body.regNumber is set
router.get('/students', studentsController.students);

// Delete all students
router.delete('/students', studentsController.deleteAllStudents);

// Get a student record
router.get('/student/:regNumber', studentsController.student);

// Delete a student record
router.delete('/student/:regNumber', studentsController.deleteStudent);

// Create exercise
router.post('/topic/:orderNumber/exercise', exerciseController.createExercise);

// Get exercise
router.get('/topic/:orderNumber/exercise/:orderId', exerciseController.getExercise);

// Delete exercise
router.delete('/topic/:orderNumber/exercise/:orderId', exerciseController.deleteExercise);

// Update exercise's data
router.put('/topic/:orderNumber/exercise/:orderId/data', exerciseController.updateExerciseData);

// Update exercise's task
router.put('/topic/:orderNumber/exercise/:orderId/task', exerciseController.updateExerciseTask);

// Update exercise's solution
router.put('/topic/:orderNumber/exercise/:orderId/solution', exerciseController.updateExerciseSolution);

// Create temporary test data, run user query against expected result and remove temporary data.
router.post('/topic/:orderNumber/exercise/:orderId/run', exerciseController.run);

module.exports = router;