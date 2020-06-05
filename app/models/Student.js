var db = require('../../config/db');

exports.getStudent = (USER) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (user:User:Student {username: $username}) RETURN user',
            {username: USER}
        ).then(result => {
            session.close();
            return result;
        });
};

exports.getStudentsByRegNumber = (regNumber, className) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (student:User:Student)-[:ENROLLED_IN]->(:Class {name: $className}) WHERE student.regNumber STARTS WITH $regNumber RETURN student',
            {
                regNumber: regNumber,
                className: className
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.getStudentByRegNumber = (regNumber, className) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (student:User:Student {regNumber: $regNumber})-[:ENROLLED_IN]->(:Class {name: $className}) RETURN student',
            {
                regNumber: regNumber,
                className: className
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.getStudentsOfClass = className => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (students:User:Student)-[:ENROLLED_IN]->(:Class {name: $className}) RETURN students',
            {className: className}
        ).then(result => {
            session.close();
            return result;
        });
}

exports.createStudent = (className, dsUsername, registrationNumber, firstName, lastName) => {
    return this.getStudent(dsUsername)
        .then(student => {
            if (!student.records[0]) {
                console.log(dsUsername + " is created");
                const session = db.session();
    
                return session
                    .run(
                        'MATCH (c:Class {name: $className}) '+
                        'CREATE (n:User:Student {username: $username, regNumber: $regNumber, firstName: $firstName, lastName: $lastName})-[r:ENROLLED_IN]->(c) '+
                        'WITH n AS student, c AS clas '+
                        'MATCH (student)-[:ENROLLED_IN]->(clas)<-[:PART_OF]-(:Topic)<-[:FROM]-(exercise:Exercise) '+
                        'MERGE (exercise)-[:ASSIGNED_TO]->(student)',
                        {
                            className: className,
                            username: dsUsername,
                            regNumber: registrationNumber,
                            firstName: firstName,
                            lastName: lastName
                        }
                    ).then(result => {
                        session.close();
                        return result;
                    });
            } else {
                throw new Error("Student with username " + dsUsername + " exists!");
            }
        });
}

exports.deleteAllStudents = (className) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (students:User:Student)-[:ENROLLED_IN]->(:Class {name: $className}) DETACH DELETE students',
            {className: className}
        ).then(result => {
            session.close();
            return result;
        });
}

exports.deleteStudent = (teacherUsername, studentRegNumber) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (student:User:Student {regNumber: $studentRegNumber})-[:ENROLLED_IN]->(:Class)<-[:TEACHES]-(:User:Teacher {username: $teacherUsername}) DETACH DELETE student',
            {
                studentRegNumber: studentRegNumber,
                teacherUsername: teacherUsername
            }
        ).then(result => {
            session.close();
            return result;
        });
}