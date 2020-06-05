var db = require('../../config/db');

exports.getTopic = (user, orderNum) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (topic:Topic {orderNumber: $orderNumber})-[:PART_OF]->(:Class)<-[:TEACHES|:ENROLLED_IN]-(:User {username: $username}) RETURN topic',
            {
                orderNumber: parseInt(orderNum),
                username: user
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.getTopicByClass = (clas, orderNum) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (topic:Topic {orderNumber: $orderNumber})-[:PART_OF]->(:Class {name: $className}) RETURN topic',
            {
                orderNumber: parseInt(orderNum),
                className: clas
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.updateTopicContent = (topicOrderNum, topicContent) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (topic:Topic {orderNumber: $orderNumber}) SET topic.content = $content',
            {
                orderNumber: parseInt(topicOrderNum),
                content: topicContent
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.getTopicsOfClass = className => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (topic:Topic)-[r:PART_OF]->(class:Class {name: $name}) RETURN topic ORDER BY topic.orderNumber',
            {
                name: className
            }
        ).then(result => {
            session.close();
            return result;
        });
};

exports.createTopic = (topicName, className) => {
    return this.getTopicsOfClass(className)
        .then(topics => {
            let isUnique = true;
            topics.records.forEach(topic => {
                if (topic._fields[0].properties.title === topicName) {
                    isUnique = false;
                }
            });
            if (isUnique) {
                let orderNumber = topics.records.length + 1;
                const session = db.session();
    
                return session
                    .run(
                        'MATCH (c:Class {name: $className}) CREATE (t:Topic {title: $topicTitle, orderNumber: $position, description: "", content: ""})-[:PART_OF]->(c)',
                        {
                            className: className,
                            topicTitle: topicName,
                            position: orderNumber
                        }
                    ).then(result => {
                        session.close();
                        return result;
                    });
            } else {
                throw new Error("UniqueConstraintViolation");
            }
        });
};

exports.updateTopicTitle = (className, oldTitle, newTitle) => {
    return this.getTopicsOfClass(className)
        .then(topics => {
            let isUnique = true;
            topics.records.forEach(topic => {
                if (topic._fields[0].properties.title === newTitle) {
                    isUnique = false;
                }
            });
            if (isUnique) {
                const session = db.session();

                return session
                    .run(
                        'MATCH (t:Topic {title: $topicTitle})-[:PART_OF]->(c:Class {name: $className}) SET t.title = $newTitle',
                        {
                            className: className,
                            topicTitle: oldTitle,
                            newTitle: newTitle
                        }
                    ).then(result => {
                        session.close();
                    });
            } else {
                throw new Error("UniqueConstraintViolation");
            }
        });
}

exports.updateTopicsOrder = (newTopicsOrder) => {
    let updates = [];

    newTopicsOrder.forEach(topic => {
        updates.push(updateTopicOrderNumber(topic.className, topic.topicTitle, topic.newPosition));
    });

    return Promise.all(updates);
};

exports.deleteTopic = (className, topicName) => {
    const session = db.session();

    return session
        .run(
            'MATCH (topic:Topic {title: $topicTitle})-[:PART_OF]->(:Class {name: $className}) '+
            'OPTIONAL MATCH (exercises:Exercise)-[:FROM]->(topic) '+
            'DETACH DELETE topic, exercises',
            {
                className: className,
                topicTitle: topicName
            }
        ).then(result => {
            session.close();
        });
}

var updateTopicOrderNumber = (clas, title, newPosition) => {
    const session = db.session();

    return session
        .run(
            'MATCH (topic:Topic {title: $title})-[r:PART_OF]->(class:Class {name: $className}) SET topic.orderNumber = $newPosition',
            {
                className: clas,
                title: title,
                newPosition: newPosition
            }
        ).then(result => {
            session.close();
        });
};