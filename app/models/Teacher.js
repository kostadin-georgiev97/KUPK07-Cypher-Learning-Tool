var db = require('../../config/db');

exports.getTeacher = (USER) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (user:User:Teacher {username: $username}) RETURN user',
            {username: USER}
        ).then(result => {
            session.close();
            return result;
        });
};