var db = require('../../config/db');
const csvToJson = require('csvtojson');
var studentModel = require('../models/Student');

exports.importStudents = (req, res) => {
    let mimetype = req.files.studentsImport.mimetype;

    if (mimetype === 'text/csv'
    || mimetype === 'application/vnd.ms-excel'
    || mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') { // File type is valid
        csvToJson()
            .fromString(req.files.studentsImport.data.toString())
            .then(studentsJson => {
                // Validate CSV data
                let isValid = true;
                let err = "";
                if (studentsJson.length == 0) {
                    isValid = false; // there are no student records to import
                    err = "There are no student records in the CSV file!";
                } else {
                    if (!studentsJson[0].hasOwnProperty('dsUsername')
                    || !studentsJson[0].hasOwnProperty('registrationNumber')
                    || !studentsJson[0].hasOwnProperty('firstName')
                    || !studentsJson[0].hasOwnProperty('lastName')) {
                        isValid = false; // CSV file column titles are incorrect
                        err = "CSV file column titles are incorrect!"
                    } else {
                        // check for duplicate dsUsername or registrationNumber
                        let dsUsernames = [];
                        let registrationNumbers = [];
                        studentsJson.forEach(student => {
                            dsUsernames.push(student.dsUsername);
                            registrationNumbers.push(student.registrationNumber);
                        });
                        let uniqueDsUsernames = dsUsernames
                            .map((user) => {
                                return {
                                    count: 1,
                                    user: user
                                }
                            })
                            .reduce((a, b) => {
                                a[b.user] = (a[b.user] || 0) + b.count;
                                return a;
                            }, {});
                        let duplicateDsUsernames = Object.keys(uniqueDsUsernames)
                            .filter((a) => uniqueDsUsernames[a] > 1);
                        let uniqueRegistrationNumbers = registrationNumbers
                            .map((regnum) => {
                                return {
                                    count: 1,
                                    regnum: regnum
                                }
                            })
                            .reduce((a, b) => {
                                a[b.regnum] = (a[b.regnum] || 0) + b.count;
                                return a;
                            }, {});
                        let duplicateRegistrationNumbers = Object.keys(uniqueRegistrationNumbers)
                            .filter((a) => uniqueRegistrationNumbers[a] > 1);
                        if (duplicateDsUsernames.length != 0) {
                            isValid = false; // there are duplicate dsUsernames
                            err = "Duplicate dsUsernames: " + duplicateDsUsernames.toString();
                            if (duplicateRegistrationNumbers.length != 0) {
                                err += "\nDuplicate registrationNumbers: " + duplicateRegistrationNumbers.toString();
                            }
                        } else if (duplicateRegistrationNumbers.length != 0) {
                            isValid = false; // there are duplicate registrationNumbers
                            err = "Duplicate registrationNumbers: " + duplicateRegistrationNumbers.toString();
                        }
                    }
                }

                if (isValid) {
                    // Check incomming students don't exist
                    let studentExists = false;
                    let existingStudentUsername = "";
                    let studentCheckPromises = [];
                    studentsJson.forEach(student => {
                        studentCheckPromises.push(studentModel.getStudent(student.dsUsername)
                            .then(result => {
                                if (result.records[0]) {
                                    studentExists = true;
                                    existingStudentUsername = student.dsUsername;
                                }
                            })
                        );
                    });
                    Promise.all(studentCheckPromises)
                        .then(result => {
                            if (!studentExists) {
                                // Create students
                                let createStudentPromises = [];
                                studentsJson.forEach(student => {
                                    createStudentPromises.push(
                                        studentModel.createStudent(req.body.clas, student.dsUsername, student.registrationNumber, student.firstName, student.lastName)
                                    );
                                });
                                Promise.all(createStudentPromises)
                                    .then(() => {
                                        res.redirect(global.rootURL + '/');
                                    })
                                    .catch(err => {
                                        console.log(err);
                                        res.redirect(global.rootURL + '/err/' + err.toString());
                                    });
                            } else {
                                let existErr = "Student with username " + existingStudentUsername + " exists."
                                console.log(existErr);
                                res.redirect(global.rootURL + '/err/' + existErr);
                            }
                        })
                        .catch(err => {
                            console.log(err);
                            res.redirect(global.rootURL + '/err/' + err.toString());
                        });
                } else { // CSV file data is not valid
                    console.log(err);
                    res.redirect(global.rootURL + '/err/' + err);
                }
            })
            .catch(err => { // Problem with converting CSV to JSON
                let errMsg = "Problem with converting CSV to JSON";
                console.log(errMsg);
                res.redirect(global.rootURL + '/err/' + errMsg);
            });
    } else { // Invalid file type
        let errMsg = "Invalid file type";
        console.log(errMsg);
        res.redirect(global.rootURL + '/err/' + errMsg);
    }
};