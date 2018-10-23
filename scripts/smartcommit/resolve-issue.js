//# sourceURL=resolve-issue.js
'use strict';

//  Classes passed as parameters by default
//
//  The passed smart commit command
// command       : com.atlassian.jira.plugins.dvcs.smartcommits.model.CommitCommands.CommitCommand
//
//  The committer user
// user          : com.atlassian.jira.user.ApplicationUser
//
//  The issue specified in smart commit
// issue         : com.atlassian.jira.issue.MutableIssue
//
//  A command result to return execution errors
// commandResult : com.atlassian.jira.plugins.dvcs.smartcommits.model.CommandsResults.CommandResult
//
//  The commit revision ID
// revision : java.lang.String
//
//  The full commit message
// commitComment : java.lang.String
//
//  The commit timestamp (unixtime format)
// commitTime : long
//
//  An e-mail of the commit author
// authorEmail : java.lang.String
//
//  An author name of the commit
// authorName : java.lang.String
//
//  Branches where commit is present
// branches : java.util.List<java.lang.String>
load(__DIR__ + '../utils.js');

var NO_STATUS = "git.repository.smartcommits.transition.error.unknownstatus";
var MULTIPLE_ACTIONS_TEMPLATE = "git.repository.smartcommits.transition.error.ambiguous";
var NO_ALLOWED_ACTIONS_TEMPLATE = "git.repository.smartcommits.transition.error.noactions";
var MAIN_BRANCH = "master";

var workflowManager = getComponent("com.atlassian.jira.workflow.WorkflowManager");
var issueManager = getComponent("com.atlassian.jira.issue.IssueManager");
var i18nHelper = getComponent("com.atlassian.jira.util.I18nHelper");

if(branches && branches.length > 0 && branches.indexOf(MAIN_BRANCH) >= 0) {
    var status = issue.getStatus();
    var possibleActionsList = getAcceptedNextSteps(workflowManager, issue);
    var commandName = command.getCommandName().replace( /-/g, " " );
    if(possibleActionsList.length > 0) {
        var newStatusId = getIdForStatusWithNameIgnoreCase(commandName, possibleActionsList);
        if(newStatusId) {
            var issueService = getComponent("com.atlassian.jira.bc.issue.IssueService");
            var transitionValidationResult = issueService.validateTransition(
                    user, issue.getId(), newStatusId, issueService.newIssueInputParameters()
            );
            if (transitionValidationResult.isValid()) {
                var transitionResult =  issueService.transition(user, transitionValidationResult);
            } else {
                // Report errors if any
                for each (var err in transitionValidationResult.getErrorCollection().getErrors()) {
            	    commandResult.addError(err);
                }
                for each (var err in transitionValidationResult.getErrorCollection().getErrorMessages()) {
            	    commandResult.addError(err);
                }
            }
        } else {
            commandResult.addError(formError(issue, i18nHelper, commandName, NO_ALLOWED_ACTIONS_TEMPLATE));
        }
    } else {
         commandResult.addError(formError(issue, i18nHelper, commandName, NO_ALLOWED_ACTIONS_TEMPLATE));
    }
}