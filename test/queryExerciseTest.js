const db = require('../config/testDB');
const assert = require('chai').assert;
var exerciseModel = require('../app/models/Exercise');
var studentModel = require('../app/models/Student');
var topicModel = require('../app/models/Topic');
var queryExerciseModel = require('../app/models/QueryExercise');
    
const session = db.session();

describe('#runQuery', () => {

    let expectedStudent = 'tst00001';
    let expectedTopic = 1;
    let expectedExercise = 1;
    let expectedData =
        'CREATE (TheMatrix:Movie {title: "The Matrix", released: 1999, tagline: "Welcome to the Real World"}) '+
        'CREATE (Keanu:Person {name: "Keanu Reeves", born: 1964}) '+
        'MERGE (Keanu)-[:ACTED_IN {roles:["Neo"]}]->(TheMatrix)';
    let expectedSolution =
        'MATCH (p:Person)-->(m:Movie) '+
        'WHERE p.name = "Keanu Reeves"'+
        'RETURN m.title';
    let expectedSolutionResult = 'The Matrix';
    let studentQuery = 'MATCH (m:Movie) RETURN m.title';
    let expectedStudentQueryResult = 'The Matrix';

    /**
     * Set up test data in Neo4j
     */
    before(async function() {
        await session
        .run(
            'CREATE (student:Student:User {username: $student, firstName: "", lastName: ""}) '+
            'CREATE (class:Class {title: ""}) '+
            'CREATE (topic:Topic {title: "", orderNumber: $topic, description: "", content: ""}) '+
            'CREATE (exercise:Exercise {orderId: $exercise, task: "", data: $data, solution: $solution}) '+
            'MERGE (student)-[:ENROLLED_IN]->(class) '+
            'MERGE (topic)-[:PART_OF]->(class) '+
            'MERGE (exercise)-[:FROM]->(topic) '+
            'MERGE (exercise)-[:ASSIGNED_TO]->(student)',
            {
                student: expectedStudent,
                topic: expectedTopic,
                exercise: expectedExercise,
                data: expectedData,
                solution: expectedSolution,
            }
        );
    });

    /**
     * Clear test data in Neo4j
     */
    after(async function() {
        await session.run('MATCH (n) DETACH DELETE n', {});
        session.close();
    });

    let actualStudent = '';

    it('run:getStudent', async function() {
        const student = await studentModel.getStudent(expectedStudent);
        assert.equal(student.records.length, 1, 'The function must return only 1 student!');

        actualStudent = student.records[0].get(0).properties.username;
        assert.equal(actualStudent, expectedStudent, 'Wrong student is returned!');
    });
    
    let actualTopic = 0;

    it('run:getTopic', async function() {
        const topic = await topicModel.getTopic(expectedStudent, expectedTopic);
        assert.equal(topic.records.length, 1, 'The function must return only 1 topic!');

        actualTopic = topic.records[0].get(0).properties.orderNumber;
        assert.equal(actualTopic, expectedTopic, 'Wrong topic is returned!');
    });
    
    let actualExercise = 0;
    let actualData = '';
    let actualSolution = '';

    it('run:getExercise', async function() {
        const exercise = await exerciseModel.getExercise(expectedStudent, expectedTopic, expectedExercise);
        assert.equal(exercise.records.length, 1, 'The function must return only 1 exercise!');

        actualExercise = exercise.records[0].get(0).properties.orderId;
        actualData = exercise.records[0].get(0).properties.data;
        actualSolution = exercise.records[0].get(0).properties.solution;
        assert.equal(actualExercise, expectedExercise, 'Wrong exercise is returned!');
        assert.equal(actualData, expectedData, 'Wrong exercise Data is returned!');
        assert.equal(actualSolution, expectedSolution, 'Wrong exercise Solution is returned!');
    });

    let sessionId;

    it('run:createTempGraph', async function() {
        //console.log('           Creating temporary graph ...');
        const result = await queryExerciseModel.createTempGraph(expectedData);

        sessionId = result;
        //console.log('           sessionId: ' + sessionId);
    });

    let actualSolutionResult = '';

    it('run:runSolutionQuery', async function() {
        //console.log('           Running expected solution query ...');

        const result = await queryExerciseModel.runQuery(expectedSolution, sessionId);

        actualSolutionResult = result.records[0].get(0);
        assert.equal(actualSolutionResult, expectedSolutionResult, 'Wrong exercise solution result is returned!');
    });

    let actualStudentQueryResult = '';

    it('run:runStudentQuery', async function() {
        //console.log('           Running student entered query ...');

        const result = await queryExerciseModel.runQuery(studentQuery, sessionId);

        actualStudentQueryResult = result.records[0].get(0);
        assert.equal(actualStudentQueryResult, expectedStudentQueryResult, 'Wrong student query result is returned!');
    });

    it('run:deleteTempGraph', async function() {
        //console.log('           Deleting temporary graph ...');

        let dbRecords = await checkForTempGraph(sessionId);
        assert.isNotEmpty(dbRecords.records, 'Temporary graph data is not deleted properly!');

        await queryExerciseModel.deleteTempGraph(sessionId);

        dbRecords = await checkForTempGraph(sessionId);
        assert.isEmpty(dbRecords.records, 'Temporary graph data is not deleted properly!');
    });
    
});

let checkForTempGraph = (sessionId) => {
    return session
    .run('MATCH (n {sid: $sessionId}) RETURN (n)', { sessionId: sessionId.toString() })
    .then((result) => {
        return result;
    });
};