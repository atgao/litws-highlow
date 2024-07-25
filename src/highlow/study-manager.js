/*************************************************************
 * Main code, responsible for configuring the steps and their
 * actions.
 *
 * Author: LITW Team.
 *
 * © Copyright 2017-2024 LabintheWild.
 * For questions about this file and permission to use
 * the code, contact us at tech@labinthewild.org
 *************************************************************/

// load webpack modules
window.$ = require("jquery");
window.jQuery = window.$;
require("../js/jquery.i18n");
require("../js/jquery.i18n.messagestore");
require("jquery-ui-bundle");
let Handlebars = require("handlebars");
window.$.alpaca = require("alpaca");
window.bootstrap = require("bootstrap");
window._ = require("lodash");

//LOAD THE HTML FOR STUDY PAGES
import progressHTML from "./pages/progress.html";
Handlebars.registerPartial('prog', Handlebars.compile(progressHTML));
import introHTML from "./pages/introduction.html";
import irbHTML from "../templates/irb.html";
import questHTML from "./pages/questionnaire.html";
import demographicsHTML from "../templates/demographics.html";
import instructionsHTML from "../templates/instructions.html";
import loadingHTML from "../templates/loading.html";
import resultsHTML from "../templates/results.html";
import resultsFooterHTML from "../templates/results-footer.html";
import commentsHTML from "../templates/comments.html";
require("../js/litw/jspsych-display-slide");
//CONVERT HTML INTO TEMPLATES
let introTemplate = Handlebars.compile(introHTML);
let irbTemplate = Handlebars.compile(irbHTML);
let questTemplate = Handlebars.compile(questHTML);
let demographicsTemplate = Handlebars.compile(demographicsHTML);
let instructionsTemplate = Handlebars.compile(instructionsHTML);
let loadingTemplate = Handlebars.compile(loadingHTML);
let resultsTemplate = Handlebars.compile(resultsHTML);
let resultsFooterTemplate = Handlebars.compile(resultsFooterHTML);
let commentsTemplate = Handlebars.compile(commentsHTML);


//TODO: document "params.study_id" when updating the docs/7-ManageData!!!
module.exports = (function(exports) {
	var timeline = [],
	params = {
		study_id: "TO_BE_ADDED_IF_USING_LITW_INFRA",
		study_recommendation: [],
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif"],
		slides: {
			INTRODUCTION: {
				name: "introduction",
				type: "display-slide",
				template: introTemplate,
				display_element: $("#intro"),
				display_next_button: false,
			},
			INFORMED_CONSENT: {
				name: "informed_consent",
				type: "display-slide",
				template: irbTemplate,
				display_element: $("#irb"),
				display_next_button: false,
			},
			QUESTIONNAIRE_1: {
				name: "quest1",
				type: "display-slide",
				template: questTemplate,
				display_element: $("#quest1"),
				display_next_button: false,
			},
			QUESTIONNAIRE_2: {
				name: "quest2",
				type: "display-slide",
				template: questTemplate,
				display_element: $("#quest2"),
				display_next_button: false,
			},
			DEMOGRAPHICS: {
				type: "display-slide",
				template: demographicsTemplate,
				display_element: $("#demographics"),
				name: "demographics",
				finish: function(){
					var dem_data = $('#demographicsForm').alpaca().getValue();
					LITW.data.submitDemographics(dem_data);
				}
			},
			COMMENTS: {
				type: "display-slide",
				template: commentsTemplate,
				display_element: $("#comments"),
				name: "comments",
				finish: function(){
					var comments = $('#commentsForm').alpaca().getValue();
					if (Object.keys(comments).length > 0) {
						LITW.data.submitComments({
							comments: comments
						});
					}
				}
			},
			RESULTS: {
				type: "call-function",
				func: function(){
					calculateResults();
				}
			}
		}
	};

	function configureStudy() {
		// timeline.push(params.slides.INTRODUCTION);
		params.slides.QUESTIONNAIRE_1.template_data = getQuest1Data();
		// timeline.push(params.slides.QUESTIONNAIRE_1);
		params.slides.QUESTIONNAIRE_2.template_data = getQuest2Data('quest2');
		timeline.push(params.slides.QUESTIONNAIRE_2);
		// timeline.push(params.slides.INFORMED_CONSENT);
		// timeline.push(params.slides.DEMOGRAPHICS);
		// timeline.push(params.slides.COMMENTS);
		// timeline.push(params.slides.RESULTS);
	}

	function getQuest1Data() {
		return {
			title: $.i18n("litw-study-quest1-title"),
			progress: {
				value: 25
			},
			quest_id: "quest1",
			done_button: $.i18n("litw-study-quest1-save"),
			questions: [1, 2].map((x)=> {
				return {
					id: x,
					text: $.i18n(`litw-study-quest1-q${x}`)
				}
			}),
			responses: [1, 2, 3, 4, 5].map((x)=> {
				return {
					id: x,
					text: $.i18n(`litw-study-quest1-a${x}`)
				}
			})
		}
	}

	function getQuest2Data(quest_id) {
		return {
			title: $.i18n(`litw-study-${quest_id}-title`),
			img_prompt: {
				url: './img/prompt_c.png'
			},
			progress: {
				value: 50
			},
			quest_id: quest_id,
			done_button: $.i18n(`litw-study-${quest_id}-save`),
			questions: [1, 2, 3].map((q)=> {
				return {
					id: q,
					text: $.i18n(`litw-study-quest2-q${q}`),
					responses: [1, 2, 3, 4, 5].map((r)=> {
						return {
							id: r,
							text: $.i18n(`litw-study-quest2-q${q}-a${r}`)
						}
					})
				}
			}),
		}
	}

	function calculateResults() {
		//TODO: Nothing to calculate
		let results_data = {}
		showResults(results_data, true)
	}

	function showResults(results = {}, showFooter = false) {
		if('PID' in params.URL) {
			//REASON: Default behavior for returning a unique PID when collecting data from other platforms
			results.code = LITW.data.getParticipantId();
		}

		$("#results").html(
			resultsTemplate({
				data: results
			}));
		if(showFooter) {
			$("#results-footer").html(resultsFooterTemplate(
				{
					share_url: window.location.href,
					share_title: $.i18n('litw-irb-header'),
					share_text: $.i18n('litw-template-title'),
					more_litw_studies: params.study_recommendation
				}
			));
		}
		$("#results").i18n();
		LITW.utils.showSlide("results");
	}

	function readSummaryData() {
		$.getJSON( "summary.json", function( data ) {
			//TODO: 'data' contains the produced summary form DB data
			//      in case the study was loaded using 'index.php'
			//SAMPLE: The example code gets the cities of study partcipants.
			console.log(data);
		});
	}

	function startStudy() {
		// generate unique participant id and geolocate participant
		LITW.data.initialize();
		// save URL params
		params.URL = LITW.utils.getParamsURL();
		if( Object.keys(params.URL).length > 0 ) {
			LITW.data.submitData(params.URL,'litw:paramsURL');
		}
		// populate study recommendation
		LITW.engage.getStudiesRecommendation(2, (studies_list) => {
			params.study_recommendation = studies_list;
		});
		// initiate pages timeline
		jsPsych.init({
		  timeline: timeline
		});
	}

	function startExperiment(){
		//TODO These methods should be something like act1().then.act2().then...
		//... it is close enough to that... maybe the translation need to be encapsulated next.
		// get initial data from database (maybe needed for the results page!?)
		//readSummaryData();

		// determine and set the study language
		$.i18n().locale = LITW.locale.getLocale();
		var languages = {
			'en': './i18n/en.json?v=1.0',
			'pt': './i18n/pt-br.json?v=1.0',
		};
		//TODO needs to be a little smarter than this when serving specific language versions, like pt-BR!
		var language = LITW.locale.getLocale().substring(0,2);
		var toLoad = {};
		if(language in languages) {
			toLoad[language] = languages[language];
		} else {
			toLoad['en'] = languages['en'];
		}
		$.i18n().load(toLoad).done(
			function() {
				$('head').i18n();
				$('body').i18n();

				LITW.utils.showSlide("img-loading");
				//start the study when resources are preloaded
				jsPsych.pluginAPI.preloadImages(params.preLoad,
					function () {
						configureStudy();
						startStudy();
					},

					// update loading indicator
					function (numLoaded) {
						$("#img-loading").html(loadingTemplate({
							msg: $.i18n("litw-template-loading"),
							numLoaded: numLoaded,
							total: params.preLoad.length
						}));
					}
				);
			});
	}



	// when the page is loaded, start the study!
	$(document).ready(function() {
		startExperiment();
	});
	exports.study = {};
	exports.study.params = params

})( window.LITW = window.LITW || {} );


