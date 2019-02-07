const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeSurveySchema = new Schema({
    survey: {
        type: Schema.Types.ObjectId,
        ref: 'Survey'
    },
    // completed true means that survey is completed
    // completed false means that survey is not completed
    completed: {
        type: Boolean,
        default: false
    }
});


module.exports = employeeSurveySchema;