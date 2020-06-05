var db = require('../../config/db');

exports.getClassByTeacher = teacherUsername => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (teacher:Teacher {username: $username})-[r:TEACHES]->(class:Class) RETURN class',
            {
                username: teacherUsername
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.getClassByStudent = studentUsername => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (:Student {username: $username})-[:ENROLLED_IN]->(class:Class) RETURN class',
            {
                username: studentUsername
            }
        ).then(result => {
            session.close();
            return result;
        });
}