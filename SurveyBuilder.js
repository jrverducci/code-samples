import React from 'react';
import * as surveyBuilderServices from "../../../services/surveyBuilderService";
import SurveyBuilderStatusDropdown from '../../components/SurveyBuilderStatusDropdown';
import SurveyBuilderTypesDropdown from '../../components/SurveyBuilderTypesDropdown';
import { Container, Draggable } from "react-smooth-dnd";
import { connect } from 'react-redux';

const applyDrag = (arr, dragResult) => {
    const { removedIndex, addedIndex, payload } = dragResult;
    if (removedIndex === null && addedIndex === null) return arr;
  
    const result = [...arr];
    let itemToAdd = payload;
  
    if (removedIndex !== null) {
      itemToAdd = result.splice(removedIndex, 1)[0];
    }
  
    if (addedIndex !== null) {
      result.splice(addedIndex, 0, itemToAdd);
    }
  
    return result;
  };

class SurveyBuilder extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            typeId: 1,
            name: '',
            description: '',
            statusId: 1,
            ownerId: 1,
            sections: [],
            surveyParentId: null,
            version: 0,
            id: null
        }
        this.newSurveySection = this.newSurveySection.bind(this);
        this.sectionTitleChange = this.sectionTitleChange.bind(this);
        this.sectionDescriptionChange = this.sectionDescriptionChange.bind(this);
        this.newSurveyQuestion = this.newSurveyQuestion.bind(this);
        this.questionInput = this.questionInput.bind(this);
        this.questionDropdown = this.questionDropdown.bind(this);
        this.newAnswerOption = this.newAnswerOption.bind(this);
        this.answerChange = this.answerChange.bind(this);
        this.inputChange = this.inputChange.bind(this);
        this.saveSurvey = this.saveSurvey.bind(this);
        this.onAnswerDrop = this.onAnswerDrop.bind(this);
        this.onQuestionDrop = this.onQuestionDrop.bind(this);
        this.onSectionDrop = this.onSectionDrop.bind(this);
        this.sortSurvey = this.sortSurvey.bind(this);
    }

    componentDidMount() {
        if (this.props.match.params.id) {
            surveyBuilderServices.getById(this.props.match.params.id)

                .then(response => {
                    this.setState({
                        name: response.data.item.name,
                        description: response.data.item.description,
                        sections: response.data.item.sections,
                        version: response.data.item.version,
                        surveyParentId: response.data.item.surveyParentId,
                        id: response.data.item.id
                    })
                })
                .catch(console.log)
        }
    }

    inputChange(event) {
        this.setState({
            [event.target.name]: event.target.value,
        })
    }

    newSurveySection() {
        const sectionsArray = [...this.state.sections]
        sectionsArray.push({
            title: '',
            sortOrder: sectionsArray.length,
            description: '',
            questions: []
        });

        const surveyObj = JSON.parse(JSON.stringify(this.state))
        surveyObj.sections = sectionsArray;

        this.setState({
            ...this.state,
            sections: sectionsArray
        });
    }

    sectionTitleChange(event, sectionIndex) {
        const sectionObj = JSON.parse(JSON.stringify(this.state.sections[sectionIndex]))
        sectionObj.title = event.target.value

        const newSectionsArray = JSON.parse(JSON.stringify(this.state.sections))
        newSectionsArray[sectionIndex] = sectionObj

        this.setState({
            ...this.state,
            sections: newSectionsArray
        })
    }

    sectionDescriptionChange(event, sectionIndex) {
        const sectionObj = JSON.parse(JSON.stringify(this.state.sections[sectionIndex]))
        sectionObj.description = event.target.value

        const newSectionsArray = JSON.parse(JSON.stringify(this.state.sections))
        newSectionsArray[sectionIndex] = sectionObj

        this.setState({
            ...this.state,
            sections: newSectionsArray
        })
    }

    newSurveyQuestion(event, sectionIndex) {
        const questionsArray = [...this.state.sections[sectionIndex].questions]
        questionsArray.push({

            sortOrder: questionsArray.length,
            question: "",
            helpText: "",
            isRequired: false,
            isMultipleAllowed: false,
            questionTypeId: '',
            statusId: 0,  // default set at 0
            userId: this.props.userProfile.userId,
            answerOptions: []
        });

        const sectionsArrayCopy = JSON.parse(JSON.stringify(this.state.sections))
        sectionsArrayCopy[sectionIndex].questions = questionsArray;

        this.setState({
            ...this.state,
            sections: sectionsArrayCopy
        });
    }

    questionInput(event, sectionIndex, questionIndex) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const questionSection = event.target.name;

        const questionObj = JSON.parse(JSON.stringify(this.state.sections[sectionIndex].questions[questionIndex]))
        questionObj[questionSection] = value

        const newSectionsArray = JSON.parse(JSON.stringify(this.state.sections))
        newSectionsArray[sectionIndex].questions[questionIndex] = questionObj

        this.setState({
            ...this.state,
            sections: newSectionsArray
        })
    }

    questionDropdown(item, sectionIndex, questionIndex, questionType) {
        const questionObj = JSON.parse(JSON.stringify(this.state.sections[sectionIndex].questions[questionIndex]))
        questionObj[questionType] = item

        const newSectionsArray = JSON.parse(JSON.stringify(this.state.sections))

        newSectionsArray[sectionIndex].questions[questionIndex] = questionObj
        this.setState({
            ...this.state,
            sections: newSectionsArray
        })
    }

    newAnswerOption(event, sectionIndex, questionIndex) {
        const newAnswerArray = [...this.state.sections[sectionIndex].questions[questionIndex].answerOptions]
        newAnswerArray.push(
            {
                text: '',
                value: '',
                userId: this.props.userProfile.userId,
                additionalInfo: 'none',
                sortOrder: newAnswerArray.length
            }
        );
        const sectionsArrayCopy = JSON.parse(JSON.stringify(this.state.sections))
        sectionsArrayCopy[sectionIndex].questions[questionIndex].answerOptions = newAnswerArray;

        this.setState({
            ...this.state,
            sections: sectionsArrayCopy
        }
        );
    }

    answerChange(event, sectionIndex, questionIndex, answerIndex) {
        const answerObj = JSON.parse(JSON.stringify(this.state.sections[sectionIndex].questions[questionIndex].answerOptions[answerIndex]))
        answerObj.text = event.target.value

        const newSectionsArray = JSON.parse(JSON.stringify(this.state.sections))
        newSectionsArray[sectionIndex].questions[questionIndex].answerOptions[answerIndex] = answerObj

        this.setState({
            sections: newSectionsArray
        }
        );
    }

    onSectionDrop(e) {
        const newSectionsArray = JSON.parse(JSON.stringify(this.state))
        newSectionsArray.sections = applyDrag(this.state.sections, e)


       this.setState({
          sections: newSectionsArray.sections
       })
    }

    onQuestionDrop(e, sectionIndex) {
        
        const newSectionsArray = JSON.parse(JSON.stringify(this.state.sections))
        newSectionsArray[sectionIndex].questions = applyDrag(this.state.sections[sectionIndex].questions, e)

       this.setState({
         sections: newSectionsArray
       })
    }

    onAnswerDrop(e, sectionIndex, questionIndex) {
        const newSectionsArray = JSON.parse(JSON.stringify(this.state.sections))
        newSectionsArray[sectionIndex].questions[questionIndex].answerOptions = applyDrag(this.state.sections[sectionIndex].questions[questionIndex].answerOptions, e)

       this.setState({
         sections: newSectionsArray
       })
    }

    sortSurvey() {
        const newSectionsArray = JSON.parse(JSON.stringify(this.state.sections))

        for (let s = 0; s < newSectionsArray.length; s++) {
            newSectionsArray[s].sortOrder = s
            for (let q = 0; q < newSectionsArray[s].questions.length; q++) {
                newSectionsArray[s].questions[q].sortOrder = q
                for (let a = 0; a < newSectionsArray[s].questions[q].answerOptions.length; a++) {
                    newSectionsArray[s].questions[q].answerOptions[a].sortOrder = a
                }
            }
        }
        return newSectionsArray
    }

    saveSurvey() {
        const sortedArr = this.sortSurvey()
        const surveyBuilderData = JSON.parse(JSON.stringify(this.state))
        surveyBuilderData.sections = sortedArr

        let promise = {}
        const surveyId = process.env.REACT_APP_MAIN_ASSESSMENT_ID
        if (this.props.match.params.id === surveyId) {
            promise = surveyBuilderServices.update(surveyBuilderData, surveyId)
        } else {
            promise = surveyBuilderServices.create(surveyBuilderData)
        }
        
        promise.then(() => {
            this.props.history.push("/survey-list/")})
     }

    render() {
        const map = this.state.sections && this.state.sections.map((sectionItem, sectionIndex) => {
            const mappedArr = sectionItem.questions.map((questionItem, questionIndex) => {
                const mappedInnerArr = questionItem.answerOptions.map((answerItem, answerIndex) => {
                    return (

                <Draggable key={answerIndex}>
                        <div className='row draggable-item'>
                            <div className="col-md-3"></div>
                            <input type="text" className="form-control col-md-6" value={answerItem.text} onChange={(event) => this.answerChange(event, sectionIndex, questionIndex, answerIndex)} placeholder="Input Answer Here" />
                            <i className="form-control__bar"></i></div>
                            </Draggable>
                    )
                })

                return (
                    
                    <Draggable key={questionIndex}>
                    <div style={{cursor: "move"}}>
                        <p></p>
                        <div className='row'>
                            <div className="col-md-2"></div>
                            <input type="text" className="form-control col-md-8" name='question' value={questionItem.question} onChange={(event) => this.questionInput(event, sectionIndex, questionIndex)} placeholder="Input Question Here" />
                            <i className="form-control__bar"></i></div>
                        <div className='row'>
                            <div className="col-md-3"></div>
                            <input type="text" className="form-control col-md-6" name='helpText' value={questionItem.helpText} onChange={(event) => this.questionInput(event, sectionIndex, questionIndex)} placeholder="text that can help clarify question...." />
                            <i className="form-control__bar"></i></div>
                        <p></p>
                        <div className='container-fluid'>
                            <div className='row'>
                                <div className="col-md-2"></div>
                                <span>Status Id</span>
                                <div className='col-md-2'>
                                    <SurveyBuilderStatusDropdown onChange={(dropdownItem) => this.questionDropdown(dropdownItem, sectionIndex, questionIndex, 'statusId')} /></div>
                                <span>Question Type</span>
                                <div className='col-md-2'>
                                    <SurveyBuilderTypesDropdown onChange={(dropdownItem) => this.questionDropdown(dropdownItem, sectionIndex, questionIndex, 'questionTypeId')} /></div>
                            </div>
                        </div>
                        <p></p>
                        <div className='row'>
                            <div className='col-md-2'></div>
                            <form className='form-horizontal'>
                                <div className='form-group'>
                                    <label className='custom-control custom-checkbox'>
                                        <input type='checkbox' className='custom-control-input' name='isRequired' checked={questionItem.isRequired} onChange={(event) => this.questionInput(event, sectionIndex, questionIndex)} />
                                        <span className='custom-control-indicator'></span>
                                        <span className='custom-control-description'>Required</span>
                                    </label>
                    
                                    <label className='custom-control custom-checkbox'>
                                        <input type='checkbox' className='custom-control-input' name='isMultipleAllowed' checked={questionItem.isMultipleAllowed} onChange={(event) => this.questionInput(event, sectionIndex, questionIndex)} />
                                        <span className='custom-control-indicator'></span>
                                        <span className='custom-control-description'>Allow Multiple Answers</span>
                                    </label>
                                </div>
                                </form>
                            </div>
                            <p></p>
                            <div className='row'>
                                <div className="col-md-2"></div>
                                <button className="btn btn-light btn-small" onClick={(event) => this.newAnswerOption(event, sectionIndex, questionIndex)}>Add Answer</button>
                           </div> 
                           <p></p>
                            <Container onDrop={e => this.onAnswerDrop(e, sectionIndex, questionIndex)}>
                                {mappedInnerArr}
                            </Container>
                        </div>
                    
                    </Draggable>
                )
            })
            return (
                <Draggable key={sectionIndex} style={{cursor: "move"}}>
                <div className="card">
                    <div className='card-body'>
                        <div>
                            <p></p>
                            <div className='row'>
                                <div className="col-md-1"></div>
                                <input type="text" className="form-control col-md-10" value={sectionItem.title} onChange={(event) => this.sectionTitleChange(event, sectionIndex)} placeholder="Input Survey Section Title Here" /> </div>
                            <i className="form-control__bar"></i>
                            <div className='row'>
                                <div className="col-md-1"></div>
                                <input type="text" className="form-control col-md-10" value={sectionItem.description} onChange={(event) => this.sectionDescriptionChange(event, sectionIndex)} placeholder="Input a Description of this Survey Section Here" />
                                <i className="form-control__bar"></i></div>
                            <div></div>
                            <br />
                            <div className='row'>
                                <div className="col-md-1"></div>
                                <button className="btn btn-light" onClick={(event) => this.newSurveyQuestion(event, sectionIndex)}>Add Survey Question</button></div></div>
                                <Container onDrop={e => this.onQuestionDrop(e, sectionIndex)}>
                        {mappedArr}
                        </Container>
                    </div>
                </div>
                </Draggable>
            )
        })
        return (
            <React.Fragment>
                <header className="content__title">
                    <h1>Survey Builder</h1>

                </header>

                <div className="card col-md-12">
                    <div className="card-body col-md-12">
                        <div className="row col-md-12">
                            <div className="form-group col-md-12">
                                <label>Survey Name</label>
                                <input type="text" className="form-control" name="name" value={this.state.name} onChange={this.inputChange} placeholder="Survey Name" />
                                <i className="form-control__bar"></i>
                            </div></div>
                        <div className="row col-md-12">
                            <div className="form-group col-md-12">
                                <label>Survey Description</label>
                                <input type="text" className="form-control" name="description" value={this.state.description} onChange={this.inputChange} placeholder="Description of Survey" />
                                <i className="form-control__bar"></i>
                            </div></div>
                        <div className="row col-md-12">
                            <button className="btn btn-light" onClick={this.newSurveySection}>Add Survey Section</button></div>
                        <p></p>
                        <Container onDrop={e => this.onSectionDrop(e)}>
                        {map}
                        </Container>
                      <button className="btn btn-light" onClick={this.saveSurvey}>Save Survey</button>
                    </div>
                </div>


            </React.Fragment>
        )
    }
}
const mapStateToProps = state => ({
    userProfile: state.userProfiles
  })

export default connect(mapStateToProps)(SurveyBuilder) 
