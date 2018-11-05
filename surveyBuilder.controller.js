const surveyService = require('../services/survey.services');
const surveySectionService = require('../services/surveysections.service');
const surveyQuestionsService = require('../services/survey-questions.service');
const surveyAnswerOptionsService = require('../services/surveyAnswerOptions.services')
const responses = require('../models/responses');

const create = (req, res) => {
    console.log(req.body)
    const surveyData = {
        name: req.body.name,
        description: req.body.description,
        statusId: req.body.statusId,
        ownerId: req.body.ownerId,
        typeId: req.body.typeId, 
        version: req.body.version, 
        surveyParentId: req.body.surveyParentId
    }
    const token = req.cookies.authentication;
    let promise = surveyService.create(surveyData, token);
    promise.then(response => {
        const surveyId = response.item
        console.log('surveyId:' + surveyId)
        for (let s = 0; s < req.body.sections.length; s++) {
            {
                const sectionData = {
                    survey: surveyId,
                    title: req.body.sections[s].title,
                    description: req.body.sections[s].description,
                    sortOrder: req.body.sections[s].sortOrder
                }

                let section = surveySectionService.create(sectionData)
                section.then(secResponse => {
                    const sectionId = secResponse
                    console.log('sectionId:' + sectionId)
                    for (let i = 0; i < req.body.sections[s].questions.length; i++) {
                        const questionData = {
                            sectionId: sectionId,
                            question: req.body.sections[s].questions[i].question,
                            helpText: req.body.sections[s].questions[i].helpText,
                            isRequired: req.body.sections[s].questions[i].isRequired,
                            userId: req.body.sections[s].questions[i].userId,
                            isMultipleAllowed: req.body.sections[s].questions[i].isMultipleAllowed,
                            questionTypeId: req.body.sections[s].questions[i].questionTypeId,
                            statusId: req.body.sections[s].questions[i].statusId,
                            sortOrder: req.body.sections[s].questions[i].sortOrder
                        }

                        let question = surveyQuestionsService.create(questionData)
                        question.then(questionResponse => {
                            const questionId = questionResponse
                            console.log('questionId:' + questionId)

                            for (let a = 0; a < req.body.sections[s].questions[i].answerOptions.length; a++) {
                                const answerData = {
                                    questionId: questionId,
                                    text: req.body.sections[s].questions[i].answerOptions[a].text,
                                    value: req.body.sections[s].questions[i].answerOptions[a].value,
                                    sortOrder: req.body.sections[s].questions[i].answerOptions[a].sortOrder,
                                    userId: req.body.sections[s].questions[i].userId,
                                    additionalInfo: req.body.sections[s].questions[i].answerOptions[a].additionalInfo
                                }
                                let answer = surveyAnswerOptionsService.create(answerData, token);
                                answer.then(answerResponse => {
                                    console.log('answerId:' + answerResponse)
                                    res.status(200).json(surveyId)
                                })
                            }
                        })
                    }

                })
            }
        }
    })
    .catch(err => {
        const responseObj = new responses.ErrorResponse();
        responseObj.errors = err.stack;
        res.status(500).send(responseObj);
    })
}

const update = (req, res) => {
    console.log(req.body)
 
    const surveyData = {
        name: req.body.name,
        description: req.body.description,
        statusId: req.body.statusId,
        ownerId: req.body.ownerId,
        typeId: req.body.typeId,
        version: req.body.version,
        surveyParentId: req.body.surveyParentId
    }

    let promise = surveyService.put(surveyData, surveyData.surveyParentId)
    promise.then(response => {
        const surveyId = surveyData.surveyParentId
        console.log("surveyId:" + surveyId) 

        for (let s = 0; s < req.body.sections.length; s++) {
                const sectionData = {
                    survey: surveyId,
                    title: req.body.sections[s].title,
                    description: req.body.sections[s].description,
                    sortOrder: req.body.sections[s].sortOrder
                }

                const section = surveySectionService.update(sectionData, sectionData.survey)
                section.then(secResponse => {
                    const sectionId = sectionData.survey
                    console.log('sectionId:' + sectionId)

                    let allQuestionPromises = []

                    for (let i = 0; i < req.body.sections[s].questions.length; i++) {
                        const questionData = {
                            sectionId: sectionId,
                            question: req.body.sections[s].questions[i].question,
                            helpText: req.body.sections[s].questions[i].helpText,
                            isRequired: req.body.sections[s].questions[i].isRequired,
                            userId: req.body.sections[s].questions[i].userId,
                            isMultipleAllowed: req.body.sections[s].questions[i].isMultipleAllowed,
                            questionTypeId: req.body.sections[s].questions[i].questionTypeId,
                            statusId: req.body.sections[s].questions[i].statusId,
                            sortOrder: req.body.sections[s].questions[i].sortOrder,
                            questionId: req.body.sections[s].questions[i].id
                        }

                        const questionPromiseObject = surveyQuestionsService.updateById(questionData, questionData.questionId)
                        allQuestionPromises.push(questionPromiseObject)
                    }

                    const questionsPromiseAll = Promise.all(allQuestionPromises)
                        .then(() => {
                            let allAnswerPromises = []
                            for (let i = 0; i < req.body.sections[s].questions.length; i++) {

                                for (let a = 0; a < req.body.sections[s].questions[i].answerOptions.length; a++) {
                                    const answerData = {
                                        questionId: req.body.sections[s].questions[i].id,
                                        text: req.body.sections[s].questions[i].answerOptions[a].text,
                                        value: req.body.sections[s].questions[i].answerOptions[a].value,
                                        sortOrder: req.body.sections[s].questions[i].answerOptions[a].sortOrder,
                                        userId: req.body.sections[s].questions[i].userId,
                                        additionalInfo: req.body.sections[s].questions[i].answerOptions[a].additionalInfo,
                                        answerId: req.body.sections[s].questions[i].answerOptions[a].id
                                    }
                                    const answer = surveyAnswerOptionsService.updateById(answerData, answerData.answerId);
                                    allAnswerPromises.push(answer)
                                    console.log('answerId:' + answerData.answerId)
                                }
                            }
                            const answerPromiseAll = Promise.all(allAnswerPromises)
                            return answerPromiseAll
                        })
                    
                        .then(() => {
                            res.status(200).json(surveyId)
                        })
                })
        }
    })
        .catch(err => {
            const responseObj = new responses.ErrorResponse();
            responseObj.errors = err.stack;
            res.status(500).send(responseObj);
        })
}

module.exports = {
    create, 
    update
}
