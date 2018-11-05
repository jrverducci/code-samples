import React from "react";
import * as surveyInstanceService from "../services/surveyInstanceService";
import * as surveyTemplateService from "../services/surveyTemplateService";
import * as userProfileInfoService from '../services/userProfileInfoService'
import * as UserServices from '../services/userService';
import { QUESTION_TYPES } from "../enums/questionTypes";
import { withCookies } from "react-cookie";
import DropzoneComponent from "./Dropzone";
import { Tabs, Tab } from "react-bootstrap";

class Assessment extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      survey: {},
      userId: "",
      surveyInstance: [],
      version: "",
      surveyId: "",
      percentage: 0,
      key: 0
    };
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onFileUpload = this.onFileUpload.bind(this);
    this.previousQuestion = this.previousQuestion.bind(this);
    this.nextQuestion = this.nextQuestion.bind(this);
    this.resetSurvey = this.resetSurvey.bind(this);
    this.onCheckChange = this.onCheckChange.bind(this);
  }

  componentDidMount() {
    let tempuserCookie = this.props.cookies.get("tempuser");
    if (tempuserCookie) {
      this.setState({
        userId: parseInt(tempuserCookie)
      });
    } else {
      const placeholder = {
        firstName: "Unregistered",
        lastName: "User",
        email: "assessment@testemail.com",
        password: "Password1!",
        referralSource: "City of LA"
      };

        const promise = UserServices.register(placeholder)
            .then((response) => {
                const assessmentUserId = response.item
                var now = new Date();
                now.setHours(now.getHours() + 72);
                document.cookie = "tempuser=" + assessmentUserId + ";expires=" + now.toUTCString() + ";"
                this.setState({
                    userId: parseInt(this.props.cookies.get('tempuser'))
                })
                return assessmentUserId
            })
        promise.then((response) => {
            const defaultUserProfile = {
                userId: response,
                bio: 'default',
                imageUrl: 'https://www.shareicon.net/data/128x128/2017/05/09/885769_user_512x512.png',
                dob: '1969-02-28',
                raceEthnicityId: 1,
                levelOfEducation: 1,
                yearsInBusiness: 1
            }
            return userProfileInfoService.create(defaultUserProfile);
        })
        .catch(() => console.log('error'))
    }

    surveyTemplateService.getById(process.env.REACT_APP_MAIN_ASSESSMENT_ID)
      .then(response => {
        this.setState({
          survey: response.item,
          surveyId: response.item.id,
          version: response.item.version
        });
      })
      .catch(() => { this.props.history.push('/error') })
  }

  getAnswersArray() {
    let survey = this.state.survey;
    const answersArr = [];
    for (let i = 0; i < survey.sections.length; i++) {
      let section = survey.sections[i];
      for (let j = 0; j < section.questions.length; j++) {
        const question = survey.sections[i].questions[j];

        if (
          question.questionTypeId === 0 &&
          question.isMultipleAllowed == true
        ) {
          for (let k = 0; k < question.answer.length; k++) {
            const questionObj = {
              questionId: question.id
            };
            questionObj.answerInt = parseInt(question.answer[k]);
            questionObj.answerOptionId = parseInt(question.answerOptionId[k]);
            answersArr.push(questionObj);
          }
        } else if (
          question.questionTypeId === 0 &&
          question.isMultipleAllowed == false
        ) {
          const questionObj = {
            questionId: question.id
          };
          questionObj.answerInt = parseInt(question.answer);
          questionObj.answerOptionId = parseInt(question.answerOptionId);
          answersArr.push(questionObj);
        } else {
          const questionObj = {
            questionId: question.id
          };
          questionObj.answer = question.answer;
          questionObj.answerOptionId = parseInt(question.answerOptionId);
          answersArr.push(questionObj);
        }
      }
    }
    return answersArr;
  }

  onChange(e, sectionIndex, questionIndex) {
    const newQuestionObj = JSON.parse(
      JSON.stringify(
        this.state.survey.sections[sectionIndex].questions[questionIndex]
      )
    );
    newQuestionObj.answer = e.target.value;
    newQuestionObj.answerOptionId = e.target.id;

    const newState = JSON.parse(JSON.stringify(this.state.survey));
    newState.sections[sectionIndex].questions[questionIndex] = newQuestionObj;

    this.setState({
      survey: newState
    });
  }

  onCheckChange(e, sectionIndex, questionIndex) {
    if (
      !this.state.survey.sections[sectionIndex].questions[questionIndex].answer
    ) {
      const newQuestionObj = JSON.parse(
        JSON.stringify(
          this.state.survey.sections[sectionIndex].questions[questionIndex]
        )
      );
      newQuestionObj.answer = [e.target.value];
      newQuestionObj.answerOptionId = [e.target.id];

      const newState = JSON.parse(JSON.stringify(this.state.survey));
      newState.sections[sectionIndex].questions[questionIndex] = newQuestionObj;

      this.setState({
        survey: newState
      });
    } else {
      const newQuestionObj = JSON.parse(
        JSON.stringify(
          this.state.survey.sections[sectionIndex].questions[questionIndex]
        )
      );
      newQuestionObj.answer.push(e.target.value);
      newQuestionObj.answerOptionId.push(e.target.id);

      const newState = JSON.parse(JSON.stringify(this.state.survey));
      newState.sections[sectionIndex].questions[questionIndex] = newQuestionObj;

      this.setState({
        survey: newState
      });
    }
  }

  resetSurvey() {
    surveyTemplateService
      .getById(process.env.REACT_APP_MAIN_ASSESSMENT_ID)
      .then(response => {
        this.setState({
          survey: response.item,
          surveyId: response.item.id,
          version: response.item.version,
          key: 0,
          percentage: 0
        });
      })
      .catch(console.log);
  }

  previousQuestion(e, question, questionIndex) {
    let previousId = questionIndex - 1;
    let newPercent =
      this.state.percentage -
      100 / (this.state.survey.sections[0].questions.length - 1);
    this.setState({
      key: previousId,
      percentage: newPercent
    });
  }

  nextQuestion(e, question, questionIndex) {
    if (question.id == 434 && question.answer == 1) {
      const arr1 = this.state.survey.sections[0].questions;
      const arr2 = arr1.slice(0, 1);
      const arr3 = arr1.slice(6, 12);
      const newArr = arr2.concat(arr3);
      const sectionsArrayCopy = JSON.parse(JSON.stringify(this.state.survey));
      sectionsArrayCopy.sections[0].questions = newArr;
      let nextId = questionIndex + 1;
      let newPercent = this.state.percentage + 100 / (newArr.length - 1);
      this.setState({
        ...this.state,
        key: nextId,
        percentage: newPercent,
        survey: sectionsArrayCopy
      });
    } else if (question.id == 434 && question.answer == 2) {
      const arr1 = this.state.survey.sections[0].questions;
      const arr2 = arr1.slice(0, 1);
      const arr3 = arr1.slice(5, 12);
      const newArr = arr2.concat(arr3);
      const sectionsArrayCopy = JSON.parse(JSON.stringify(this.state.survey));
      sectionsArrayCopy.sections[0].questions = newArr;
      let nextId = questionIndex + 1;
      let newPercent = this.state.percentage + 100 / (newArr.length - 1);
      this.setState({
        ...this.state,
        key: nextId,
        percentage: newPercent,
        survey: sectionsArrayCopy
      });
    } else if (question.id == 434 && question.answer == 3) {
      const arr1 = this.state.survey.sections[0].questions;
      const arr2 = arr1.slice(0, 1);
      const arr3 = arr1.slice(3, 12);
      const newArr = arr2.concat(arr3);
      const sectionsArrayCopy = JSON.parse(JSON.stringify(this.state.survey));
      sectionsArrayCopy.sections[0].questions = newArr;
      let nextId = questionIndex + 1;
      let newPercent = this.state.percentage + 100 / (newArr.length - 1);
      this.setState({
        ...this.state,
        key: nextId,
        percentage: newPercent,
        survey: sectionsArrayCopy
      });
    } else if (question.id == 434 && question.answer == 6) {
      const arr1 = this.state.survey.sections[0].questions;
      const newArr = arr1.slice(0, 8);
      const sectionsArrayCopy = JSON.parse(JSON.stringify(this.state.survey));
      sectionsArrayCopy.sections[0].questions = newArr;
      let nextId = questionIndex + 1;
      let newPercent = this.state.percentage + 100 / (newArr.length - 1);
      this.setState({
        ...this.state,
        key: nextId,
        percentage: newPercent,
        survey: sectionsArrayCopy
      });
    } else {
      let nextId = questionIndex + 1;
      let newPercent =
        this.state.percentage +
        100 / (this.state.survey.sections[0].questions.length - 1);
      this.setState({
        key: nextId,
        percentage: newPercent
      });
    }
  }

  onSubmit() {
    const values = {};
    values.answers = this.getAnswersArray();
    values.surveyTemplateId = this.state.surveyId;
    surveyInstanceService
      .postAnswer(values)
      .then(() => this.props.history.push("/recommendations"));
  }

  onFileUpload(uploadedImage, sectionIndex, questionIndex) {
    const newQuestionObj = JSON.parse(
      JSON.stringify(
        this.state.survey.sections[sectionIndex].questions[questionIndex]
      )
    );
    newQuestionObj.answer = uploadedImage;

    const newState = JSON.parse(JSON.stringify(this.state.survey));
    newState.sections[sectionIndex].questions[questionIndex] = newQuestionObj;

    this.setState({
      survey: newState
    });
  }

  questionType(question, sectionIndex, questionIndex) {
    let answer;
    switch (question.questionTypeId) {
      case QUESTION_TYPES.YES_NO_I_DONT_KNOW:
        if (question.answerOptions && question.isMultipleAllowed == false) {
          answer = question.answerOptions.map((answer, answerIndex) => {
            return (
              <div
                className="form-group"
                key={answer.id}
                onChange={e => this.onChange(e, sectionIndex, questionIndex)}
              >
                <div>
                  <label className="custom-control custom-radio">
                    <span className="custom-control-description">
                      {answer.text}
                    </span>
                    <input
                      type="radio"
                      checked={null}
                      value={answerIndex + 1}
                      name={answer.questionId}
                      id={answer.id}
                      className="custom-control-input"
                    />
                    <span className="custom-control-indicator" />
                  </label>
                  <div className="clearfix mb-2" />
                </div>
              </div>
            );
          });
        } else {
          answer = question.answerOptions.map((answer, answerIndex) => {
            return (
              <div
                className="form-group"
                key={answer.id}
                onChange={e =>
                  this.onCheckChange(e, sectionIndex, questionIndex)
                }
              >
                <div>
                  <label className="custom-control custom-checkbox">
                    <span className="custom-control-description">
                      {answer.text}
                    </span>
                    <input
                      type="checkbox"
                      checked={null}
                      value={answerIndex + 1}
                      name={answer.questionId}
                      id={answer.id}
                      className="custom-control-input"
                    />
                    <span className="custom-control-indicator" />
                  </label>
                  <div className="clearfix mb-2" />
                </div>
              </div>
            );
          });
        }
        break;
      case QUESTION_TYPES.SHORT_TEXT:
        if (question.answerOptions) {
          answer = question.answerOptions.map((answer, answerIndex) => {
            return (
              <div key={answer.id}>
                <div className="form-group">
                  <input
                    type="text"
                    value={question.textAnswer}
                    id={answer.id}
                    className="form-control ass-text"
                    onChange={e =>
                      this.onChange(e, sectionIndex, questionIndex)
                    }
                    name={answer}
                  />
                  <i
                    className="form-group__bar"
                    style={{ position: "absolute" }}
                  />
                </div>
              </div>
            );
          });
        }
        break;
      case QUESTION_TYPES.LONG_TEXT:
        if (question.answerOptions) {
          answer = question.answerOptions.map((answer, answerIndex) => {
            return (
              <div key={answer.id}>
                <div className="form-group">
                  <textarea
                    className="form-control textarea-autosize"
                    value={question.textAnswer}
                    id={answer.id}
                    onChange={e =>
                      this.onChange(e, sectionIndex, questionIndex)
                    }
                    style={{
                      overflow: "hidden",
                      overflowWrap: "break-word",
                      height: "49px"
                    }}
                  />
                  <i className="form-group__bar" />
                </div>
              </div>
            );
          });
        }
        break;
      case QUESTION_TYPES.UPLOAD:
        if (question.answerOptions) {
          answer = question.answerOptions.map(answer => {
            return (
              <div key={answer.id}>
                <p className="card-subtitle" id={answer.id}>
                  {answer.text}
                </p>
                <img
                  style={{ height: "100px", width: "100px" }}
                  src={question.textAnswer}
                  alt="Uploaded Picture"
                />
                <br />
                <br />
                <DropzoneComponent
                  getUrl={url => {
                    this.onFileUpload(url, sectionIndex, questionIndex);
                  }}
                />
              </div>
            );
          });
        }
        break;
      default:
        console.log("error");
    }
    return answer;
  }

  render() {
    const survey = this.state.survey;

    return (
      <React.Fragment>
        <div className="container assessment">
          <div class="card">
            <div class="card-body">
              <h4 class="card-title">{survey.name}</h4>
              <div
                className="progress-bar"
                style={{
                  position: "relative",
                  height: "20px",
                  width: "50%",
                  borderRadius: "50px",
                  border: "1px solid #333"
                }}
              >
                <div
                  className="filler"
                  percentage={this.state.percentage}
                  style={{
                    background: "#1DA598",
                    height: "100%",
                    borderRadius: "inherit",
                    transition: "width .2s ease-in",
                    width: `${this.state.percentage}%`
                  }}
                />
              </div>
              <br />
              {survey &&
                survey.sections &&
                survey.sections.map((section, sectionIndex) => {
                  return (
                    <Tabs
                      activeKey={this.state.key}
                      id={section.id}
                      animation={false}
                      className="w3-container city w3-animate-right"
                    >
                      {section.questions &&
                        section.questions.map((question, questionIndex) => {
                          return (
                            <Tab
                              eventKey={questionIndex}
                              className="w3-container city w3-animate-right"
                            >
                              <p className="ass-question">
                                {question.question}
                              </p>
                              <div>
                                <br />
                                {this.questionType(
                                  question,
                                  sectionIndex,
                                  questionIndex
                                )}
                              </div>
                              <div className="row">
                                {questionIndex != 0 &&
                                  questionIndex != 1 && (
                                    <button
                                      type="button"
                                      className="btn btn-light col-sm-3 pull-left"
                                      onClick={e =>
                                        this.previousQuestion(
                                          e,
                                          question,
                                          questionIndex
                                        )
                                      }
                                    >
                                      Previous Question
                                    </button>
                                  )}
                                {questionIndex == 1 && (
                                  <button
                                    type="button"
                                    className="btn btn-light col-sm-3 pull-left"
                                    onClick={this.resetSurvey}
                                  >
                                    Previous Question
                                  </button>
                                )}
                                <div className="col-sm-6" />
                                {questionIndex !=
                                  this.state.survey.sections[0].questions
                                    .length -
                                    1 && (
                                  <button
                                    type="button"
                                    disabled={!question.answer}
                                    className="btn btn-light col-sm-3 pull-right"
                                    onClick={e =>
                                      this.nextQuestion(
                                        e,
                                        question,
                                        questionIndex
                                      )
                                    }
                                  >
                                    Next Question
                                  </button>
                                )}
                              </div>
                              <br />
                              {questionIndex ==
                                this.state.survey.sections[0].questions.length -
                                  1 && (
                                <div className="row">
                                  <button
                                    type="button"
                                    disabled={!question.answer}
                                    style={{
                                      backgroundColor: "#264057",
                                      color: "#fff"
                                    }}
                                    className="btn btn-light btn-block col-md-3 mx-auto"
                                    onClick={this.onSubmit}
                                  >
                                    Submit Assessment
                                  </button>
                                </div>
                              )}
                            </Tab>
                          );
                        })}
                    </Tabs>
                  );
                })}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default withCookies(Assessment);
