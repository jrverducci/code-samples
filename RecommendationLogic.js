import React from 'react';
import Select from 'react-select';
import * as recommendationServices from '../../../services/recommendationsService';
import * as coachExpertiseServices from '../../../services/coachExpertiseService';
import * as resourceService from '../../../services/resourceService';
import { ControlLabel, FormControl, HelpBlock } from 'react-bootstrap';
import * as surveyQuestionAnswerOptionsService from '../../../services/SurveyQuestionAnswerOptionsService'

class RecommendationLogic extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            questionOptions: [
                { value: 'default', label: 'default' },
            ],

            selectedQuestion: '',
            answerOptions: [
                { value: 'default', label: 'default' },
            ],

            coachExpertiseOptions: [
                { value: 'default', label: 'default' },
            ],
            selectedCoachExpertise: null,
            resourceOptions: [
                { value: 'default', label: 'default' },
            ],
            selectedResource: null,
            description: {
                input: false,
                value: ''
            },
            id: '',
            whereString: '',
            answerOptionArr: [],
            questionArray: [],

            answerCheck:false,
            answer2Check:false,
            answerRadio:1,

            zipCheck: false,
            edit:false,

        }
        this.handleExpertiseChange = this.handleExpertiseChange.bind(this);
        this.handleResourceChange = this.handleResourceChange.bind(this);
        this.handleQuestionChange = this.handleQuestionChange.bind(this);
        this.handleQuestionTwoChange = this.handleQuestionTwoChange.bind(this);
        this.getQuestionTwoOptions = this.getQuestionTwoOptions.bind(this);
        this.getAnswerOptionsOne = this.getAnswerOptionsOne.bind(this)
        this.getAnswerOptionsTwo = this.getAnswerOptionsTwo.bind(this);
        this.handleAnswerChange = this.handleAnswerChange.bind(this);
        this.handleAnswerTwoChange = this.handleAnswerTwoChange.bind(this);
        this.handleOptionChange = this.handleOptionChange.bind(this);
        this.onChange = this.onChange.bind(this);
        this.newQuestion = this.newQuestion.bind(this);
        this.submit = this.submit.bind(this);
        this.toRecommendationList = this.toRecommendationList.bind(this);
        this.selectDropdowns = this.selectDropdowns.bind(this)
        this.extractAnswerOptionId = this.extractAnswerOptionId.bind(this)
        this.makeObj = this.makeObj.bind(this)
        this.setAnswers=this.setAnswers.bind(this)
        this.setQuestionsAndAnswers = this.setQuestionsAndAnswers.bind(this)
        this.reloadPage=this.reloadPage.bind(this)
    }

    componentDidMount() {
        const prom1 = recommendationServices.getQuestionsBySectionId(process.env.REACT_APP_MAIN_ASSESSMENT_ID)
            .then((response) => {
                
                const questions = [];
                const temp = response.items;
                temp.map(item => { questions.push({ value: item.id, label: item.question }) })
                this.setState({
                    questionOptions: questions
                })
            })
        const prom2 = coachExpertiseServices.getAll()
            .then((response) => {
                const expertises = [];
                const temp = response.items;
                temp.map(item => { expertises.push({ value: item.id, label: item.expertise }) })
                this.setState({ coachExpertiseOptions: expertises })
            })
        const prom3 = resourceService.getAllCategories()
            .then((response) => {
                const resources = [];
                const temp = response.items;
                temp.map(item => { resources.push({ value: item.id, label: item.type }) })
                this.setState({ resourceOptions: resources })
            })

        Promise.all([prom1, prom2, prom3]).then(() => {

            if (this.props.match.params.id) {
                var id = this.props.match.params.id
                recommendationServices.readRecommendationById(id)
                    .then(response => {

                        var extract = this.extractAnswerOptionId(response.item.whereString)
                        this.setState({
                            id: response.item.id,
                            coeachExpertiseId: response.item.coachExpertiseTypeId,
                            resourceProviderId: response.item.resourceProviderId,
                            whereString: response.item.whereString,
                            description: this.makeObj(response.item.description),
                            answerOptionArr: extract.ansArr,
                            radio1: extract.radioArr[0],
                            radio2: extract.radioArr[1],
                            edit:true

                        })
                        return response.item
                    })
                    .then(response => {
                        this.selectDropdowns(response)
                        return this.state.answerOptionArr
                    })
                    .then(response => this.setQuestionsAndAnswers(response))

            }
        })
    }

    makeObj(val) {
        const obj = {
            input: true,
            value: val
        }
        return obj;
    }

 setQuestionsAndAnswers(answerArray) {
     
        if (answerArray.length === 2) {
            const promise1 = surveyQuestionAnswerOptionsService.surveyQuestionAnswerOptionsReadById(answerArray[0])
                .then(response => {  
                    const questionSelection = this.state.questionOptions.find(option => option.value === response.item.questionId)
                    this.setState({
                        selectedQuestion: questionSelection
                    })                    
                    return response.item.questionId
                })

            const promise2 = surveyQuestionAnswerOptionsService.surveyQuestionAnswerOptionsReadById(answerArray[1])
                .then(response => {
                     
                    const questionSelection2 = this.state.questionTwoOptions.find(option => option.value === response.item.questionId)
                    this.setState({
                        selectedQuestionTwo: questionSelection2
                    })                     
                    return response.item.questionId
                })

            const returnPromise = Promise.all([promise1, promise2])
                .then(([prom1, prom2]) => {
                    if (this.state.selectedQuestionTwo) {
                        const promise11 = this.getAnswerOptionsTwo(this.state.selectedQuestionTwo)
                        const promise10 = this.getAnswerOptionsOne(this.state.selectedQuestion)
                        return Promise.all([promise10, promise11])
                    }
                })

            return returnPromise;

        } else {
            const promise1 =  surveyQuestionAnswerOptionsService.surveyQuestionAnswerOptionsReadById(answerArray[0])
                .then(response => {
                    const questionSelection = this.state.questionOptions.find(option => option.value === response.item.questionId)
                    this.setState({
                        selectedQuestion: questionSelection
                    })
                    return response.item.questionId
                })
                .then((prom1) => {
                    const promise10 = this.getAnswerOptionsOne(this.state.selectedQuestion)
                })
                
            return promise1;
        }
    }

    extractAnswerOptionId(whereString) {
        let radioArr = [];
        let extract = whereString.replace(/#TempSurveyAnswers.AO_/g, '');
        let strArray = extract.split('AND')
        let ansArr = [];
        if(strArray.includes('IN')){
            this.setState({
                zipCheck:true
            })
         
        }
        for (let i = 0; i < strArray.length; i++) {
            if (strArray[i].includes('= 1') || strArray[i].includes('=1')) {
                radioArr.push(1)
                strArray[i] = strArray[i].replace(/= 1/, '');
            } else {

                radioArr.push(0)
                strArray[i] = strArray[i].replace(/= 0/, '');
            }
            ansArr.push(parseInt(strArray[i]))
        }

        if(ansArr.length===2){
            this.newQuestion()          
        }
        return { ansArr, radioArr }
    }

    selectDropdowns(response) {
        let coachSelection = this.state.coachExpertiseOptions.find(option => option.value === response.coachExpertiseTypeId)
        let resourceSelection = this.state.resourceOptions.find(option => option.value === response.resourceProviderId)

        this.setState({
            selectedCoachExpertise: coachSelection,
            selectedResource: resourceSelection,
        });
    }

    setAnswers(answerArray) {
        let answerSelection2 = ''
        if (this.state.answerOptionArr.length === 2) {
            answerSelection2 = this.state.answerTwoOptions.find(option => option.value === answerArray[1])
            this.setState({
                selectedAnswerTwo: answerSelection2,
                answerCheck2: false
            });
            let answerSelection = this.state.answerOptions.find(option => option.value === answerArray[0])
            this.setState({
                selectedAnswer: answerSelection
                , answerCheck: false
            });
        } else {
            let answerSelection = this.state.answerOptions.find(option => option.value === answerArray[0])
            this.setState({
                selectedAnswer: answerSelection
                , answerCheck: false
            });
        }
    }

    getQuestionTwoOptions() {
        recommendationServices.getQuestionsBySectionId(process.env.REACT_APP_MAIN_ASSESSMENT_ID)
            .then((response) => {
                 
                const questions = [];
                const temp = response.items;
                temp.map(item => { questions.push({ value: item.id, label: item.question }) })
                this.setState({ questionTwoOptions: questions })
            })
    }

    getAnswerOptionsOne(selectedQuestion) {
        recommendationServices.getAnswersByQuestionId(selectedQuestion.value)
        .then((response) => {           
                const answers = [];
                const temp = response.items;
                temp.map(item => { answers.push({ value: item.id, label: item.text }) })
                this.setState({ answerOptions: answers,
                    answerCheck:true
                })
            })
    }

    getAnswerOptionsTwo(selectedQuestionTwo) {
        recommendationServices.getAnswersByQuestionId(selectedQuestionTwo.value)
        .then((response) => {                     
                const answers = [];
                const temp = response.items;
                temp.map(item => { answers.push({ value: item.id, label: item.text }) })
                this.setState({ answerTwoOptions: answers,
                    answerCheck2:true
                })
            })

    }

    onChange(e) {
        const value = { value: e.target.value, input: true };
        this.setState({
            [e.target.name]: value
        })
    }

    handleExpertiseChange = (selectedCoachExpertise) => { this.setState({ selectedCoachExpertise }) }

    handleResourceChange = (selectedResource) => { this.setState({ selectedResource }) }

    handleQuestionChange(selectedQuestion) {
        
        this.setState(({ selectedQuestion }),
         this.getAnswerOptionsOne(selectedQuestion))
    }

    handleQuestionTwoChange(selectedQuestionTwo) {
        this.setState(({ selectedQuestionTwo }), this.getAnswerOptionsTwo(selectedQuestionTwo))
    }

    handleAnswerChange = (selectedAnswer) => { this.setState({ selectedAnswer }) }

    handleAnswerTwoChange = (selectedAnswerTwo) => { this.setState({ selectedAnswerTwo }) }

    handleOptionChange(changeEvent) {
        if (changeEvent.target.type === 'radio') {
            this.setState({
                [changeEvent.target.name]: JSON.parse(changeEvent.target.value),
                radio: true
            })
        }
        else {
            const target = changeEvent.target;
            const value = target.type === 'checkbox' ? target.checked : target.value;
            const name = target.name;
            this.setState({
                [name]: JSON.parse(value),
            })
        }
    }

    newQuestion() {
        this.setState(({
            questionTwoOptions: [
                { value: 'default', label: 'default' },
            ],
            selectedQuestionTwo: null,

            answerTwoOptions: [
                { value: 'default', label: 'default' },
            ],
            selectedAnswerTwo: null,
        }), this.getQuestionTwoOptions)
    }

    submit() {
        const data = this.state;
        
        if (this.props.match.params.id) {
            let id = this.props.match.params.id
            recommendationServices.put(this.state, id)
            .then(() => {
                this.props.history.push("/data-management/recommendation/list/");
            })
        }else{
        recommendationServices.post(data)
            .then(() => {
                this.props.history.push("/data-management/recommendation/list/");
            })
        }
    }

    toRecommendationList() {
        this.props.history.push("/data-management/recommendation/list/");
    }
    reloadPage(){
        this.props.history.push("/data-management/recommendation-logic/");
    }

    render() {
        if ((this.state.answerCheck || this.state.answerCheck2)&&this.state.edit) {
            this.setAnswers(this.state.answerOptionArr);
        }

        const customStyle = {
            option: (base, state) => ({
                borderBottom: '1px dotted gray',
                padding: 8,
                ...base,
                color: state.isFocused ? 'blue' : 'black',
            }),
        }
        return (
            <React.Fragment>
                <header className="content__title">
                    <h1>Recommendation Logic</h1>
                </header>
                <div className="actions">
                    <a className="actions__item zmdi zmdi-arrow-left zmdi-hc-fw" onClick={this.toRecommendationList}></a>
                    {!this.state.edit?<a className="actions__item zmdi zmdi-refresh zmdi-hc-fw" onClick={()=>window.location.reload()}></a>:null}
                </div>
                <div className="card col-md-12">
                    <div className="card-body col-md-12">
                        <label>What coach expertise or resource provider category are you creating recommendation logic for?</label>
                        <div className="clearfix mb-2"></div>
                        {!this.state.selectedResource && <React.Fragment>
                            <label>Select Coach Expertise</label>
                            <Select className="drop_style" styles={customStyle}
                                value={this.state.selectedCoachExpertise} onChange={this.handleExpertiseChange} options={this.state.coachExpertiseOptions} />
                            <div className="clearfix mb-2"></div>
                        </React.Fragment>}
                        {!this.state.selectedCoachExpertise && <React.Fragment>
                            <label>and/or Select resource provider category</label>
                            <Select className="basic-multi-select" classNamePrefix="select" isMulti styles={customStyle} value={this.state.selectedResource} onChange={this.handleResourceChange} options={this.state.resourceOptions} />
                        </React.Fragment>}
                        <br></br>
                        <br></br>
                        <label>What answer selection(s) will match to the selected expertise or resoure provider category?</label>
                        <div className="clearfix mb-2"></div>
                        <label>Select Assessment Question:</label>
                        <Select className="drop_style" styles={customStyle} value={this.state.selectedQuestion} onChange={this.handleQuestionChange} options={this.state.questionOptions} />
                        <div className="clearfix mb-2"></div>
                        {this.state.selectedQuestion && <React.Fragment> <label>Select Question Answer:</label>
                            <Select className="drop_style" styles={customStyle} value={this.state.selectedAnswer} onChange={this.handleAnswerChange} options={this.state.answerOptions} />
                            <div className="clearfix mb-2"></div> </React.Fragment>}
                        {this.state.selectedAnswer && <React.Fragment> <label>What logic do you desire based on the selected answer?</label>
                            <div className="clearfix mb-2"></div>
                            <label className="custom-control custom-radio">
                                <input id="answerRadio1" name="answerRadio" type="radio" className="custom-control-input" value={1} checked={this.state.answerRadio === 1} onChange={this.handleOptionChange} />
                                <span className="custom-control-indicator"></span>
                                <span className="custom-control-description">User must select this answer to match.</span>
                            </label>
                            <label className="custom-control custom-radio">
                                <input id="answerRadio2" name="answerRadio" type="radio" className="custom-control-input" value={0} checked={this.state.answerRadio === 0} onChange={this.handleOptionChange} />
                                <span className="custom-control-indicator"></span>
                                <span className="custom-control-description">User must select any answer EXCEPT this to match.</span>
                            </label>
                            <div className="clearfix mb-2"><br></br></div> </React.Fragment>}
                            {this.state.selectedAnswer && <React.Fragment> <label>Require the zip code to be in the City of Los Angeles?</label>
                            <div className="clearfix mb-2"></div>
                            <label className="custom-control custom-checkbox">
                                <input id="zipCodeCheck" name="zipCheck" type="checkbox" className="custom-control-input" checked={this.state.zipCheck} onChange={this.handleOptionChange} />
                                <span className="custom-control-indicator"></span>
                                <span className="custom-control-description">City of Los Angeles Zip Code required.</span>
                            </label>
                            <div className="clearfix mb-2"><br></br></div> </React.Fragment> } 
                        {this.state.selectedAnswer && <React.Fragment>
                            <button className="btn btn-light" onClick={this.newQuestion}>Add another question?</button>
                            <div className="clearfix mb-2"><br></br></div>
                        </React.Fragment>}
                        {this.state.questionTwoOptions && <React.Fragment>
                            <label>Select Second Assessment Question:</label>
                            <Select className="drop_style" styles={customStyle} value={this.state.selectedQuestionTwo} onChange={this.handleQuestionTwoChange} options={this.state.questionTwoOptions} />
                            <div className="clearfix mb-2"><br></br></div>
                        </React.Fragment>}
                        {this.state.selectedQuestionTwo && <React.Fragment>
                            <label>Select Second Question Answer:</label>
                            <Select className="drop_style" styles={customStyle} value={this.state.selectedAnswerTwo} onChange={this.handleAnswerTwoChange} options={this.state.answerTwoOptions} />
                            <div className="clearfix mb-2"><br></br></div>
                        </React.Fragment>}
                        {this.state.selectedAnswer && 
                        <React.Fragment> <ControlLabel>Description</ControlLabel>
                            <FormControl
                                className={this.state.description.input ? 'is-valid' : 'is-invalid'}
                                type="textarea"
                                name="description"
                                placeholder="Describe the reason this logic creates the recommendation"
                                value={this.state.description.value}
                                onChange={this.onChange}
                            />
                            <i className="form-control__bar"></i>
                            <FormControl.Feedback />
                            {!this.state.description.input ? <HelpBlock style={{ position: "absolute" }}>Description is required</HelpBlock> : null} <div className="clearfix mb-2"></div><br></br></React.Fragment>}
                        {this.state.selectedAnswer && <React.Fragment><button className="btn btn-light" onClick={this.submit}>{this.state.edit?"Edit Recommendation Logic":"Submit New Recommendation Logic"}</button> </React.Fragment>}
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

export default RecommendationLogic
