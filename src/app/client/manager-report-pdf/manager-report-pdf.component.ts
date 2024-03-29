import { Component, OnInit, ViewChild } from "@angular/core";
import { ReportService } from "../../@core/data/report.service";
import { EmployeeService } from "../../@core/data/employee.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { ActivatedRoute } from "@angular/router";
import { NbSpinnerService } from "@nebular/theme";
import * as CanvasJS from "../../../assets/canvasjs.min.js";
import { environment } from "../../../environments/environment";

@Component({
  selector: "ngx-manager-report-pdf",
  templateUrl: "./manager-report-pdf.component.html",
  styleUrls: ["./manager-report-pdf.component.scss"],
})
export class ManagerReportPdfComponent implements OnInit {
  clientImage = null;
  baseUrl = !environment.production ? "http://localhost:8080" : "";
  employeeId;
  filterData = {
    start_date: null,
    end_date: null,
    level: "",
    occupational_group: "",
    gender: "",
    tenure: "",
    state: "",
  };
  genders = [
    { id: "Male", value: "Male" },
    { id: "Female", value: "Female" },
  ];
  employee;
  employee_details;
  client;
  completed_surveys = 0;
  organizations;
  organizations_divisions_departments = [];
  top_leaving_reasons = [];
  response_array = [];
  leaving_reason_rearranged_array = [];
  manager;
  pdfChartWidth = 900;
  exit_reasons = [
    { id: 1, value: "Career Opportunities" },
    { id: 2, value: "Meaningful Work" },
    { id: 3, value: "Communication" },
    { id: 4, value: "Effective Leadership" },
    { id: 5, value: "Induction" },
    { id: 6, value: "Learning & Development" },
    { id: 7, value: "Manager" },
    { id: 8, value: "Pay & Benefits" },
    { id: 9, value: "Work Conditions" },
    { id: 10, value: "Being Valued" },
    { id: 14, value: "Operational" },
    { id: 15, value: "Restructure" },
  ];
  tenures = [
    { id: 1, value: "< 1 year" },
    { id: 2, value: "1 - 2 years" },
    { id: 3, value: "3 - 5 years" },
    { id: 4, value: "6 - 10 years" },
    { id: 5, value: "> 10 years" },
  ];
  occupations = [
    { id: 1, value: "Not Classified" },
    { id: 2, value: "Managers" },
    { id: 3, value: "Professionals" },
    { id: 4, value: "Technicians and Trade Workers" },
    { id: 5, value: "Community and Personal Service Workers" },
    { id: 6, value: "Clerical and Administrative Workers" },
    { id: 7, value: "Sales Workers" },
    { id: 8, value: "Machinery Operators and Drivers" },
    { id: 9, value: "Labourers" },
  ];
  states = [
    { id: 1, value: "NSW" },
    { id: 2, value: "QLD" },
    { id: 3, value: "SA" },
    { id: 4, value: "TAS" },
    { id: 5, value: "VIC" },
    { id: 6, value: "WA" },
    { id: 7, value: "ACT" },
    { id: 8, value: "NT" },
  ];

  single = [];
  // view = [700, 400];
  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  schemaType = "ordinal";
  showDataLabel = false;
  showXAxisLabel = true;
  xAxisLabel = "";
  showYAxisLabel = true;
  yAxisLabel = "Percentage Distribution ( % )";

  // colorScheme = {
  //     domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  // };
  barChartColorSchema = {
    domain: ["#5AA454", "#C7B42C", "#A10A28"],
  };
  colorScheme = "night";

  onSelect(event) {
    console.log(event);
  }

  top_reason_for_leaving_chart_data = [];
  career_opportunities_chart_data = [];
  meaningful_work_chart_data = [];
  communication_chart_data = [];
  effective_leadership_chart_data = [];
  induction_chart_data = [];
  learning_development_chart_data = [];
  manager_chart_data = [];
  pay_benefits_chart_data = [];
  work_conditions_chart_data = [];
  being_valued_chart_data = [];
  operational_chart_data = [];
  restructure_chart_data = [];

  gender_split_chart_data = [];
  tenure_split_chart_data = [];
  age_split_chart_data = [];
  occupation_split_chart_data = [];

  employee_sentiment = [];
  employee_sentiment_working_chart_data = [];
  eswcdCanvasData = [];
  employee_sentiment_not_working_chart_data = [];
  esnwcdCanvasData = [];
  // here we need to declare a dictionary
  // where key will be the exit reason and value will be the array
  // for example exit_reason === '1' so value will be top_reason_for_leaving_chart_data
  exit_reason_data_mapper = [
    {
      exit_reason: "1",
      value: this.career_opportunities_chart_data,
      canvasData: [],
    },
    {
      exit_reason: "2",
      value: this.meaningful_work_chart_data,
      canvasData: [],
    },
    { exit_reason: "3", value: this.communication_chart_data, canvasData: [] },
    {
      exit_reason: "4",
      value: this.effective_leadership_chart_data,
      canvasData: [],
    },
    { exit_reason: "5", value: this.induction_chart_data, canvasData: [] },
    {
      exit_reason: "6",
      value: this.learning_development_chart_data,
      canvasData: [],
    },
    { exit_reason: "7", value: this.manager_chart_data, canvasData: [] },
    { exit_reason: "8", value: this.pay_benefits_chart_data, canvasData: [] },
    {
      exit_reason: "9",
      value: this.work_conditions_chart_data,
      canvasData: [],
    },
    { exit_reason: "10", value: this.being_valued_chart_data, canvasData: [] },
    { exit_reason: "14", value: this.operational_chart_data, canvasData: [] },
    { exit_reason: "15", value: this.restructure_chart_data, canvasData: [] },
  ];
  titleMargin = 20;

  @ViewChild("agePieChart") agePieChart;
  @ViewChild("tenurePieChart") tenurePieChart;
  @ViewChild("genderPieChart") genderPieChart;
  @ViewChild("topReasonVerticalChart") topReasonVerticalChart;
  textArray = [];

  constructor(
    private employeeService: EmployeeService,
    private reportService: ReportService,
    private route: ActivatedRoute,
    private spinnerService: NbSpinnerService,
  ) {
    this.employee = {};
  }

  ngOnInit() {
    this.spinnerService.load();
    this.route.queryParams.subscribe((params) => {
      this.employeeId = params["employeeId"];
      this.filterData = {
        start_date:
          params["start_date"] == "null" || !params["start_date"]
            ? null
            : params["start_date"],
        end_date:
          params["end_date"] == "null" || !params["end_date"]
            ? null
            : params["end_date"],
        level: params["level"] || this.filterData["level"],
        occupational_group:
          params["occupational_group"] || this.filterData["occupational_group"],
        gender: params["gender"] || this.filterData["gender"],
        tenure: params["tenure"] || this.filterData["tenure"],
        state: params["state"] || this.filterData["state"],
      };
      this.getEmployee();
    });
  }

  getEmployee() {
    this.employeeService.getEmployee(this.employeeId).subscribe(
      (data) => {
        this.employee = data;
        console.log(data);
        this.employee.employee_id = this.employeeId;
        this.clientImage = data.employee.client.image
          ? this.baseUrl + "/images/client/" + data.employee.client.image
          : "https://workforceretention.s3-ap-southeast-2.amazonaws.com/assets/images/logo_transparent.png";
        this.getManagerReport();
      },
      (err) => {
        console.log(err);
      },
    );
  }

  getManagerReport() {
    this.reportService
      .getReport(this.employeeId, this.filterData)
      .subscribe((res) => {
        this.manager = res.manager;
        this.getManagerDetails();
        this.showChartReport(res);
      });
  }

  getManagerDetails() {
    this.reportService
      .getReportDetails(this.employee.employee_id)
      .subscribe((res) => {
        this.organizations = res.organizations;
        this.arrangeOrganization();
      });
  }

  arrangeOrganization() {
    // check the logged in employee is set to full reporting is yes or not
    if (this.manager.is_report === "0") {
      this.organizations = this.organizations.filter(
        (o) => o._id === this.manager.organization._id,
      );
    }
    this.organizations_divisions_departments = [];
    if (!this.NotNullOrEmpty(this.organizations)) {
      this.organizations.map((org) => {
        const organization = {
          id: org._id,
          class: "organization",
          name: org.name,
        };
        this.organizations_divisions_departments.push(organization);
        if (!this.NotNullOrEmpty(org.divisions)) {
          org.divisions.map((division) => {
            const newDivision = {
              id: org._id + "_" + division._id,
              name: "\u00A0 --" + division.name,
              class: "division",
            };
            this.organizations_divisions_departments.push(newDivision);
            if (!this.NotNullOrEmpty(division.departments)) {
              division.departments.map((department) => {
                const newDepartment = {
                  id: org._id + "_" + division._id + "_" + department._id,
                  class: "department",
                  name: "\u00A0 \u00A0 ---" + department.name,
                };
                this.organizations_divisions_departments.push(newDepartment);
              });
            }
          });
        }
      });
    }
  }

  NotNullOrEmpty(obj) {
    return typeof obj === "undefined" || obj == null;
  }

  viewReport() {
    this.getManagerReport();
  }

  // *************** RULES ***************
  // first find the top 3 reasons for leaving the exit interview
  // calculation
  // Reason                1st choice     2nd choice   total points     percentage
  // Career Opportunities    10               2            12
  // Pay & Benefits          8                2            10
  // Work Conditions         4                5            9
  // Operational             2                2            4
  // Learning & Development  2                2            4
  // Manager                 2                1            3
  // Meaningful Work         2                0            2
  // Effective Leadership    0                1            1

  // Percentage Calculation
  // total points = 45
  // Career Opportunities Percentage = (12 /45) * 100 = 26.66 %

  // for all Question under Career Opportunities for each question there will be a bar in the chart
  // For example there are 4 questions in the Career Opportunities Category So there will be 4 bar in the chart
  // Now calculate how many people Agree, Neutral and Disagree (Need to calculate percentage as well)
  // Agree and Strongly Agree --------------------- 11
  // Disagree and Strongly Disagree --------------- 4
  // Neutral -------------------------------------- 0

  // Percentage of Agree and Strongly Agree ------ (11 / 15) * 100 = 73.33 %
  // Percentage of Disagree and Strongly Disagree -(4/15) * 100 = 26.66 %
  // Percentage of Neutral ------------------------(0/15) * 100 = 0 %

  // response will be something like this
  // top_reasons (Array of objects) {label: Career Opportunities, percentage: 26.66 }
  // answers (Array of objects) {question_id : 1, category_label: Career Opportunities, answers : [{label:Agree and Strongly Agree, percentage: 73.33}]}

  // re-arrange the answers by the category label (highest leaving reason)

  //     [
  //         {
  //             "name": "Germany",
  //             "series": [
  //                 {
  //                     "name": "2010",
  //                     "value": 40632
  //                 },
  //                 {
  //                     "name": "2000",
  //                     "value": 36953
  //                 },
  //                 {
  //                     "name": "1990",
  //                     "value": 31476
  //                 }
  //             ]
  //         },
  // {
  //     "name": "United Kingdom",
  //     "series": [
  //     {
  //         "name": "2010",
  //         "value": 36240
  //     },
  //     {
  //         "name": "2000",
  //         "value": 32543
  //     },
  //     {
  //         "name": "1990",
  //         "value": 26424
  //     }
  // ]
  // }
  // ]
  showChartReport(data) {
    this.client = data.client;

    // *************************************** Aggregate Data Only Filtering ***************************
    // check if the filterData.level !== ""
    // check the selected level is organization or division or department
    // if the selected level is organization check res.client.org_mgt === '0' 0 means aggregate data only
    // if the selected level is division check res.client.div_mgt === '0'
    // if the selected level is department check res.client.dept_mgt === '0'

    // if the selected option is aggregate data only then we should check how many employees completed the survey
    // if this.completed_surveys is less than 5 we should not display the chart report
    let show_data = true;
    const message =
      "To assure anonymity, at least 5 surveys must be completed at this level before you can view these reports";

    if (this.client.org_mgt === 0) {
      if (data.completed < 5) {
        show_data = false;
      }
    }
    // selected level is division level
    if (this.client.div_mgt === 0) {
      if (data.completed < 5) {
        show_data = false;
      }
    }
    // selected level is department level
    if (this.client.dept_mgt === 0) {
      if (data.completed < 5) {
        show_data = false;
      }
    }
    if (show_data) {
      this.completed_surveys = data.completed;
      this.top_reason_for_leaving_chart_data = [];
      // first get the final question
      // find the top 3 reasons for leaving the exit interview from the final question

      // ***************Gender Calculation***************
      this.gender_split_chart_data = data.genders;
      // from gender data calculate percentage
      let total = 0;
      this.gender_split_chart_data.map((g) => {
        total += g.value;
      });
      if (total !== 0) {
        this.gender_split_chart_data
          .filter((g) => {
            return g.value != 0;
          })
          .map((g) => {
            g.value = (g.value / total) * 100;
            g.label = g.name;
            g.y = g.value;
          });
        this.gender_split_chart_data = this.gender_split_chart_data.filter(
          (g) => {
            return g.value != 0;
          },
        );
      } else {
        this.gender_split_chart_data = [];
      }
      console.log("gender_split_chart_data", this.gender_split_chart_data);
      // ****************Age Calculation******************
      // from ages data calculate percentage
      this.age_split_chart_data = data.ages;
      total = 0;
      this.age_split_chart_data.map((a) => {
        total += a.value;
      });
      if (total !== 0) {
        this.age_split_chart_data.map((a) => {
          a.value = (a.value / total) * 100;
          a.label = a.name;
          a.y = a.value;
        });
        this.age_split_chart_data = this.age_split_chart_data.filter((a) => {
          return a.value != 0;
        });
      } else {
        this.age_split_chart_data = [];
      }

      // *****************Tenure Calculation****************
      this.tenure_split_chart_data = data.tenures;
      total = 0;
      this.tenure_split_chart_data.map((t) => {
        total += t.value;
      });
      if (total !== 0) {
        this.tenure_split_chart_data.map((t) => {
          t.value = (t.value / total) * 100;
          t.label = t.name;
          t.y = t.value;
        });
        this.tenure_split_chart_data = this.tenure_split_chart_data.filter(
          (t) => {
            return t.value != 0;
          },
        );
      } else {
        this.tenure_split_chart_data = [];
      }

      // *****************Occupation Calculation****************
      this.occupation_split_chart_data = data.occupations;
      total = 0;
      this.occupation_split_chart_data.map((t) => {
        total += t.value;
      });
      if (total !== 0) {
        this.occupation_split_chart_data.map((t) => {
          t.value = (t.value / total) * 100;
          t.label = t.name;
          t.y = t.value;
        });
        this.occupation_split_chart_data =
          this.occupation_split_chart_data.filter((t) => {
            return t.value != 0;
          });
      } else {
        this.occupation_split_chart_data = [];
      }

      this.response_array = data.response_array;
      const final_question = data.response_array.find(
        (ex) => ex.exit_reason === "13",
      );
      // Percentage Calculation
      // total points = 45
      // Career Opportunities Percentage = (12 /45) * 100 = 26.66 %
      let total_points = 0;
      final_question.options.map((option) => {
        total_points += option.answered;
      });
      // now calculate the percentage for each option
      final_question.options.map((option) => {
        option.percentage = ((option.answered / total_points) * 100).toFixed(2);
        // Percentage upto 2 decimal place
      });
      // now we need to re-arrange options by percentage in the descending order
      final_question.options.sort((a, b) =>
        a.label == "true" && b.label == "false" ? 1 : -1,
      );
      final_question.options.sort((a, b) =>
        parseFloat(a.percentage) < parseFloat(b.percentage) ? 1 : -1,
      );
      this.leaving_reason_rearranged_array = final_question.options;
      // now we can take the first three items and insert it into the top_leaving_reasons array
      this.top_leaving_reasons = [];
      if (final_question.options.length > 3) {
        for (let i = 0; i < 3; i++) {
          if (final_question.options[i].answered == 0) continue;
          this.top_leaving_reasons.push(final_question.options[i]);
        }
        // this means there are more than 3 items so we can take the first 3 items
        // this.top_leaving_reasons.push(final_question.options[0], final_question.options[1], final_question.options[2]);
      }
      final_question.options.map((option) => {
        const result = {
          name: this.exit_reasons[option.label_index].value,
          value: option.percentage,
        };
        this.top_reason_for_leaving_chart_data.push(result);
      });

      // foreach answer in the response_array find out the percentage
      this.response_array.map((answer) => {
        if (answer.exit_reason !== "13") {
          // we already find out the percentage for final question. so we don't need to do this again
          total_points = 0;
          answer.options.map((option) => {
            total_points += option.answered;
          });
          // now calculate the percentage for each option
          answer.options.map((option) => {
            option.percentage = (option.answered / total_points) * 100;
          });
        }
      });

      // Now loop through the final question options and find out exit reason by the label_index
      // after finding the exit reason find out all the answers by the exit reason
      // for example exit reason is 3 (communication). so find out all the answers which exit_reason is 3
      // finally rearrange the data like as the above structure

      // make empty the exit_reason_data_mapper array. so that later time when we click on view report button don't duplicate data
      this.exit_reason_data_mapper.map((mapped_reason) => {
        mapped_reason.value = [];
      });
      const positive_values = ["Strongly Agree", "Agree"];
      const negative_values = ["Disagree", "Strongly Disagree"];
      final_question.options.map((option) => {
        const mapped_reason = this.exit_reason_data_mapper[option.label_index];
        const filtered_reason = this.response_array.filter(
          (x) => x.exit_reason === mapped_reason.exit_reason,
        );
        filtered_reason.map((reason) => {
          // name
          // series
          const series = [];
          // calculate the total percentage. if total percentage is zero that means nobody answered this question
          // so we don't need to push the object into the array
          let calculated_total_percentage = 0;
          reason.options.map((r) => {
            calculated_total_percentage += r.percentage;
          });
          // calculate the positive percentage, negative percentage, neutrals
          let positive = 0;
          let negative = 0;
          let neutral = 0;
          let total_answered = 0;
          reason.options.map((r, index) => {
            if (reason.question_type === "3") {
              if (JSON.parse(r.label)) {
                // this will make string "true" to boolean true
                series.push({
                  name: this.exit_reasons[index].value,
                  value: r.percentage,
                });
              }
            } else if (reason.question_type === "1") {
              total_answered += r.answered;
              if (
                positive_values.findIndex(
                  (item) => r.label.toLowerCase() === item.toLowerCase(),
                ) > -1
              ) {
                positive += r.answered;
              } else if (
                negative_values.findIndex(
                  (item) => r.label.toLowerCase() === item.toLowerCase(),
                ) > -1
              ) {
                negative += r.answered;
              } else {
                neutral += r.answered;
              }
            } else {
              series.push({ name: r.label, value: r.percentage });
            }
          });
          const positive_percentage = (positive / total_answered) * 100;
          const negative_percentage = (negative / total_answered) * 100;
          const neutral_percentage = (neutral / total_answered) * 100;
          if (reason.question_type === "1") {
            series.push({ name: "Agreed", value: positive_percentage });
            series.push({ name: "Disagreed", value: negative_percentage });
            series.push({ name: "Neutral", value: neutral_percentage });
          }
          if (
            calculated_total_percentage !== 0 &&
            !isNaN(calculated_total_percentage)
          ) {
            const rearrange_answer = {
              name: reason.exit_reporting_label,
              series: series,
            };
            mapped_reason.value.push(rearrange_answer);
          }
        });
        mapped_reason.canvasData = [];
        if (mapped_reason.value.length > 0) {
          for (let i = 0; i < mapped_reason.value[0].series.length; i++) {
            const canvasData = {
              type: "stackedColumn100",
              name: mapped_reason.value[0].series[i].name,
              showInLegend: true,
              yValueFormatString: '#,##0"%"',
              dataPoints: [],
              indexLabelFormatter: function (e) {
                if (e.dataPoint.y === 0) return "";
                else return e.percent.toFixed(2) + "%";
              },
            };
            for (let j = 0; j < mapped_reason.value.length; j++) {
              // if (mapped_reason.value[j].series[i].value == 0) continue;
              canvasData.dataPoints.push({
                label: mapped_reason.value[j].name,
                y: mapped_reason.value[j].series[i].value,
              });
            }
            mapped_reason.canvasData.push(canvasData);
          }
        }
      });
      this.single = this.top_reason_for_leaving_chart_data;
      this.single = this.single.filter((x) => parseFloat(x.value) != 0);
      // Solution for reducing the bar width but it's not working

      // get all the rating radio button questions
      // now sort by agree/strongly agree in the descending order
      // now divide the length of the array by 2
      // now take first half for what's working
      // and second half for what's not working
      // What's working
      // What's not working
      this.employee_sentiment = [];
      this.employee_sentiment_working_chart_data = [];
      this.employee_sentiment_not_working_chart_data = [];
      const rating_radio_button_questions = data.response_array.filter(
        (q) => q.question_type == 1,
      );
      // now we need to find the positive_percentage as well as negative percentage
      rating_radio_button_questions.map((question) => {
        let positive = 0;
        let negative = 0;
        let total_answered = 0;
        question.options.map((option) => {
          total_answered += option.answered;
          if (
            positive_values.findIndex(
              (item) => option.label.toLowerCase() === item.toLowerCase(),
            ) > -1
          ) {
            positive += option.answered;
          } else {
            negative += option.answered;
          }
        });
        let positive_percentage = 0;
        let negative_percentage = 0;
        if (total_answered > 0) {
          positive_percentage = (positive / total_answered) * 100;
          negative_percentage = (negative / total_answered) * 100;
        }
        const series = [];
        series.push({ name: "Agreed", value: positive_percentage });
        series.push({
          name: "Disagreed / Neutral",
          value: negative_percentage,
        });
        // concatenate exit_reason with exit_reporting_label
        this.employee_sentiment.push({
          name:
            this.exit_reasons.find((ex) => ex.id == question.exit_reason)
              .value +
            " - " +
            question.exit_reporting_label,
          positive_percentage,
          series: series,
        });
      });
      // sort by agree/strongly agree in the descending order
      this.employee_sentiment.sort((a, b) =>
        parseFloat(a.positive_percentage) < parseFloat(b.positive_percentage)
          ? 1
          : parseFloat(b.positive_percentage) <
            parseFloat(a.positive_percentage)
          ? -1
          : 0,
      );
      const sentiment_divider_length = Math.round(
        this.employee_sentiment.length / 2,
      );
      for (let i = 0; i < Math.min(sentiment_divider_length, 10); i++) {
        this.employee_sentiment_working_chart_data.push(
          this.employee_sentiment[i],
        );
      }
      this.eswcdCanvasData = [];
      if (this.employee_sentiment_working_chart_data.length > 0) {
        this.employee_sentiment_working_chart_data =
          this.employee_sentiment_working_chart_data.reverse();
        for (
          let i = 0;
          i < this.employee_sentiment_working_chart_data[0].series.length;
          i++
        ) {
          const canvasData = {
            type: "stackedBar100",
            name: this.employee_sentiment_working_chart_data[0].series[i].name,
            showInLegend: true,
            yValueFormatString: '#,##0"%"',
            indexLabelFormatter: function (e) {
              if (e.dataPoint.y === 0) return "";
              else return e.percent.toFixed(2) + "%";
            },
            dataPoints: [],
          };
          for (
            let j = 0;
            j < this.employee_sentiment_working_chart_data.length;
            j++
          ) {
            if (
              this.employee_sentiment_working_chart_data[j].series[i].value == 0
            )
              continue;
            canvasData.dataPoints.push({
              label: this.employee_sentiment_working_chart_data[j].name,
              y: this.employee_sentiment_working_chart_data[j].series[i].value,
            });
          }
          this.eswcdCanvasData.push(canvasData);
        }
      }
      for (
        let i = sentiment_divider_length;
        i <
        Math.min(this.employee_sentiment.length, sentiment_divider_length + 10);
        i++
      ) {
        this.employee_sentiment_not_working_chart_data.push(
          this.employee_sentiment[i],
        );
      }
      this.esnwcdCanvasData = [];
      if (this.employee_sentiment_not_working_chart_data.length > 0) {
        for (
          let i = 0;
          i < this.employee_sentiment_not_working_chart_data[0].series.length;
          i++
        ) {
          const canvasData = {
            type: "stackedBar100",
            name: this.employee_sentiment_not_working_chart_data[0].series[i]
              .name,
            showInLegend: true,
            yValueFormatString: '#,##0"%"',
            indexLabelFormatter: function (e) {
              if (e.dataPoint.y === 0) return "";
              else return e.percent.toFixed(2) + "%";
            },
            dataPoints: [],
          };
          for (
            let j = 0;
            j < this.employee_sentiment_not_working_chart_data.length;
            j++
          ) {
            if (
              this.employee_sentiment_not_working_chart_data[j].series[i]
                .value == 0
            )
              continue;
            canvasData.dataPoints.push({
              label: this.employee_sentiment_not_working_chart_data[j].name,
              y: this.employee_sentiment_not_working_chart_data[j].series[i]
                .value,
            });
          }
          this.esnwcdCanvasData.push(canvasData);
        }
      }
      console.log("***************** what's working *************");
      console.log(this.eswcdCanvasData);
      console.log("***************** what's not working *************");
      console.log(this.esnwcdCanvasData);

      // ******************************* Transform the chart data like as CanvasJs Chart ***********************

      // *********************** Top Leaving Reason Chart *************************
      this.single.map((reason) => {
        reason.y = parseFloat(reason.value);
        reason.label = reason.name;
      });
      setTimeout(() => {
        this.initColorPallete();
        this.showTopReasonChart();
        this.showReasonStackedChart();
        this.showEswcdStackedChart();
        this.showEsnwcdStackedChart();
        this.showGenderChart();
        this.showTenureChart();
        this.showAgeChart();
        this.showOccupationChart();
      }, 200);
    } else {
      alert(message);
    }
  }

  initColorPallete() {
    CanvasJS.addColorSet("mainColorSets", [
      "#bce02e",
      "#e0642e",
      "#e0d62e",
      "#2e97e0",
      "#b02ee0",
      "#e02e75",
      "#5ce02e",
      "#e0b02e",
      "#519f75",
      "#f4bbe7",
    ]);
    CanvasJS.addColorSet("stackColorSets", [
      "#99cc66",
      "#ff0000",
      "#6699cc",
      "#2e97e0",
      "#b02ee0",
      "#e02e75",
      "#5ce02e",
      "#e0b02e",
      "#519f75",
      "#f4bbe7",
    ]);
    CanvasJS.addColorSet("sentimentColorSets", [
      "#99cc66",
      "orange",
      "#6699cc",
      "#2e97e0",
      "#b02ee0",
      "#e02e75",
      "#5ce02e",
      "#e0b02e",
      "#519f75",
      "#f4bbe7",
    ]);
    CanvasJS.addColorSet("pieColorSets", [
      "#99cc66",
      "orange",
      "#6699cc",
      "#f4bbe7",
      "#b02ee0",
      "#e02e75",
      "#5ce02e",
      "#e0b02e",
      "#519f75",
      "#2e97e0",
    ]);
  }

  showTopReasonChart() {
    const top_reason_chart = new CanvasJS.Chart("topReasonVerticalChart", {
      colorSet: "mainColorSets",
      width: this.pdfChartWidth,
      exportEnabled: false,
      backgroundColor: "#f9f9f9",
      // title: {
      //     text: 'Top Reasons for Leaving - Percentage Distribution',
      //     margin: this.titleMargin
      // },
      axisY: {
        title: "Percentage Distribution (%)",
        gridDashType: "dot",
      },
      axisX: {
        labelAngle: -80,
      },
      data: [
        {
          type: "column",
          indexLabel: "{y}%",
          dataPoints: this.single,
        },
      ],
    });
    top_reason_chart.render();
  }

  showReasonStackedChart() {
    this.leaving_reason_rearranged_array.forEach((response, index) => {
      if (this.exit_reason_data_mapper[response.label_index].value.length == 0)
        return;
      const reason_stacked_chart = new CanvasJS.Chart(
        "reasonStackedChart" + response.label_index,
        {
          colorSet: "stackColorSets",
          width: this.pdfChartWidth,
          exportEnabled: false,
          backgroundColor: "#f9f9f9",
          // title: {
          //     text: this.exit_reasons[response.label_index].value + ' ( Rank ' + (index + 1) + ' )',
          //     margin: this.titleMargin
          // },
          axisY: {
            suffix: "%",
            gridDashType: "dot",
          },
          toolTip: {
            shared: true,
          },
          legend: {
            reversed: true,
            verticalAlign: "center",
            horizontalAlign: "right",
          },
          data: this.exit_reason_data_mapper[response.label_index].canvasData,
        },
      );
      reason_stacked_chart.render();
    });
  }
  showEswcdStackedChart() {
    const eswcdChart = new CanvasJS.Chart("employeeSentimentChart", {
      colorSet: "sentimentColorSets",
      width: this.pdfChartWidth,
      exportEnabled: false,
      backgroundColor: "#f9f9f9",
      // title: {
      //     text: "Employee Sentiment What's Working",
      //     margin: this.titleMargin
      // },
      axisY: {
        suffix: "%",
        gridDashType: "dot",
      },
      toolTip: {
        shared: true,
      },
      legend: {
        reversed: true,
        verticalAlign: "center",
        horizontalAlign: "right",
      },
      data: this.eswcdCanvasData,
    });
    eswcdChart.render();
  }
  showEsnwcdStackedChart() {
    const esnwcdChart = new CanvasJS.Chart("employeeSentimentNotChart", {
      colorSet: "sentimentColorSets",
      width: this.pdfChartWidth,
      exportEnabled: false,
      backgroundColor: "#f9f9f9",
      // title: {
      //     text: "Employee Sentiment What's Not Working",
      //     margin: this.titleMargin
      // },
      axisY: {
        suffix: "%",
        gridDashType: "dot",
      },
      axisX: {
        labelMaxWidth: 500,
      },
      toolTip: {
        shared: true,
      },
      legend: {
        reversed: true,
        verticalAlign: "center",
        horizontalAlign: "right",
      },
      data: this.esnwcdCanvasData,
    });
    esnwcdChart.render();
  }
  showGenderChart() {
    const genderChart = new CanvasJS.Chart("genderChart", {
      colorSet: "pieColorSets",
      width: this.pdfChartWidth,
      exportEnabled: false,
      backgroundColor: "#f9f9f9",
      // title: {
      //     text: "Gender Split",
      //     margin: this.titleMargin
      // },
      axisY: {
        suffix: "%",
        gridDashType: "dot",
      },
      axisX: {
        labelMaxWidth: 500,
      },
      toolTip: {
        shared: true,
      },
      legend: {
        reversed: true,
        verticalAlign: "center",
        horizontalAlign: "right",
      },
      data: [
        {
          type: "pie",
          showInLegend: true,
          startAngle: 240,
          yValueFormatString: '##0.00"%"',
          indexLabel: "{y}",
          dataPoints: this.gender_split_chart_data,
        },
      ],
    });
    genderChart.render();
  }
  showTenureChart() {
    const tenureChart = new CanvasJS.Chart("tenureChart", {
      colorSet: "pieColorSets",
      width: this.pdfChartWidth,
      exportEnabled: false,
      backgroundColor: "#f9f9f9",
      // title: {
      //     text: "Tenure Split",
      //     margin: this.titleMargin
      // },
      axisY: {
        suffix: "%",
        gridDashType: "dot",
      },
      toolTip: {
        shared: true,
      },
      legend: {
        reversed: true,
        verticalAlign: "center",
        horizontalAlign: "right",
      },
      data: [
        {
          type: "pie",
          showInLegend: true,
          startAngle: 240,
          yValueFormatString: '##0.00"%"',
          indexLabel: "{y}",
          dataPoints: this.tenure_split_chart_data,
        },
      ],
    });
    tenureChart.render();
  }
  showOccupationChart() {
    const occupationChart = new CanvasJS.Chart("occupationChart", {
      colorSet: "pieColorSets",
      width: this.pdfChartWidth,
      exportEnabled: false,
      backgroundColor: "#f9f9f9",
      // title: {
      //     text: "Tenure Split",
      //     margin: this.titleMargin
      // },
      axisY: {
        suffix: "%",
        gridDashType: "dot",
      },
      toolTip: {
        shared: true,
      },
      legend: {
        reversed: true,
        verticalAlign: "center",
        horizontalAlign: "right",
      },
      data: [
        {
          type: "pie",
          showInLegend: true,
          startAngle: 240,
          yValueFormatString: '##0.00"%"',
          indexLabel: "{y}",
          dataPoints: this.occupation_split_chart_data,
        },
      ],
    });
    occupationChart.render();
  }
  showAgeChart() {
    const ageChart = new CanvasJS.Chart("ageChart", {
      colorSet: "pieColorSets",
      width: this.pdfChartWidth,
      exportEnabled: false,
      backgroundColor: "#f9f9f9",
      // title: {
      //     text: "Age Split",
      //     margin: this.titleMargin
      // },
      axisY: {
        suffix: "%",
        gridDashType: "dot",
      },
      toolTip: {
        shared: true,
      },
      legend: {
        reversed: true,
        verticalAlign: "center",
        horizontalAlign: "right",
      },
      data: [
        {
          type: "pie",
          showInLegend: true,
          startAngle: 240,
          yValueFormatString: '##0.00"%"',
          indexLabel: "{y}",
          dataPoints: this.age_split_chart_data,
        },
      ],
    });
    ageChart.render();
  }
}
