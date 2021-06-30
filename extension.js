/********************************************************************************\
* Import libraries
\********************************************************************************/
const fs = require('fs');
const vscode = require('vscode');
const gitlab = require('gitlab');
const path = require('path');

const GIT_QUERY_APP_DIR = process.env.APPDATA + "\\gitquery";
const GIT_QUERY_APP_DATA = GIT_QUERY_APP_DIR + "\\query.json";
const GIT_QUERY_APP_TIMEOUT = 5000;

/**
 * @param {vscode.ExtensionContext} context
 */

/********************************************************************************\
* Function Definitions
\********************************************************************************/

/********************************************************************************\
* Name        : getUserInfo
* Called by   : Multiple (Util)
* Arguments   : Placeholder text: String, list of choices: String[]
* Return      : User input: String
* Description : Function that returns user pick from a list of options
\********************************************************************************/
async function getUserInfo(myplaceholder, runnerList) {
    let userInputWindow = await vscode.window.showQuickPick(runnerList);

    //Todo: Return the input in the format GIT likes
    return userInputWindow;
}

/********************************************************************************\
* Name        : jsonReader
* Called by   : Multiple (Util)
* Arguments   : filePath: String, cb
* Return      : None
* Description : Reads existing stored data
\********************************************************************************/
function jsonReader(filePath, cb) {
    fs.readFile(filePath, "utf8", (err, fileData) => {
        if(err) {
            return cb && cb(err)
        }
        try {
            const object = JSON.parse(fileData);
            return cb && cb(null, object)
        } catch(err) {
            return cb && cb(err)
        }
    })
}

/********************************************************************************\
* Name        : exportToJsonFile
* Called by   : Multiple (Util)
* Arguments   : jsonData: String
* Return      : None
* Description : Saves output JSON data in APPDATA
\********************************************************************************/
async function exportToJsonFile(jsonData) {

    jsonReader(GIT_QUERY_APP_DATA, (err, fileData) => {
        if(err && fileData == undefined) {

            let dataStr = JSON.stringify(jsonData, null, 4);
            fs.writeFile(GIT_QUERY_APP_DATA, dataStr, function(err) {
                if(err) {
                    console.log(err);
                }
            })

            console.log(err)
            return
        }

        let i;
        let writeData = [];

        for(i = 0; i<fileData.length; i++) {
            writeData[i] = fileData[i];
        }

        writeData[i+1] = jsonData;

        let dataStr = JSON.stringify(writeData, null, 4);

        fs.writeFile(GIT_QUERY_APP_DATA, dataStr, function(err) {
            if(err) {
                console.log(err);
            }
        })
    })

}

/********************************************************************************\
* Name        : checkProjectStatus
* Called by   : checkRunnerStatus
* Arguments   : prjectID: int, runnerID: String
* Return      : None
* Description : Checks the status of a given runner for a project
\********************************************************************************/
async function checkProjectStatus(projectID, runnerID) {
    return new Promise(resolveJob => {

        setTimeout(() => {
            resolveJob('Skipped');
        }, GIT_QUERY_APP_TIMEOUT);

        var config = vscode.workspace.getConfiguration('gitQuery');

        const api = new gitlab.Gitlab({
            token: config['token'],
            host: config['host']
        })

        let idx = 0;
        let writeData = [];

        api.Jobs.all(projectID).then(async jobList => {

            const job = await jobList;
            if(job.length != 0) {

                for (let j = 0; j<job.length; j++) {
                    if(
                        job[j]['status'] == 'pending' ||
                        job[j]['status'] == 'created' ||
                        job[j]['status'] == 'running'
                    ) {

                        //console.log(job[j]);
                        if (
                            job[j]['runner']['description'] == runnerID ||
                            runnerID == 'All Jobs'
                        ) {

                            console.log(job[j]);
                            writeData[idx] = job[j];
                            idx = idx + 1;
                        }
                    }
                }

            }

            resolveJob(writeData);
        })
        .then(undefined, err => {
            //Skip over
        });
    })
}

/********************************************************************************\
* Name        : checkRunnerStatus
* Called by   : activate
* Arguments   : runnerID: String
* Return      : None
* Description : Checks the status of a given runner (Pending | Running | Created)
\********************************************************************************/
async function checkRunnerStatus(runnerID)
{
    return new Promise((resolveJobStatus) => {

        var config = vscode.workspace.getConfiguration('gitQuery');

        const api = new gitlab.Gitlab({
            token: config['token'],
            host: config['host']
        })

        // let idx = 0;
        let writeData = [];

        api.Projects.all().then(async projects => {

            const data = await projects;

            const doNextPromise = (d) => {

                checkProjectStatus(data[d]['id'], runnerID).then(x => {
                    d++;
                    //console.log(x);

                    if (
                        (x != 'Skipped') &&
                        (x.length != 0)
                    ){

                        writeData = writeData.concat(x);
                        console.log(d + '/' + (data.length - 1) + '-->' + data[d - 1]['http_url_to_repo'])
                    }
                    else {
                        console.log('Skipped: ' + d + '/' + (data.length - 1) + '-->' + data[d - 1]['http_url_to_repo'])
                    }

                    let statusPercent = Math.round(d * 100/(data.length - 1));
                    vscode.window.setStatusBarMessage('GIT QUERY : ' + statusPercent + '%', 5000);

                    if(d < data.length - 1){
                        doNextPromise(d)
                    }
                    else {
                        vscode.window.showInformationMessage('GIT QUERY: Complete');
                        resolveJobStatus(writeData);
                    }
                })
            }

            doNextPromise(0);
        });
    })

}

/********************************************************************************\
* Name        : activate
* Called by   : external command
* Arguments   : context: Class
* Return      : None
* Description : Main Activate function from extension command
\********************************************************************************/
function activate(context) {

	if(!fs.existsSync(GIT_QUERY_APP_DIR)) {
        fs.mkdirSync(GIT_QUERY_APP_DIR, {
            recursive: true
        });
    }

    fs.writeFile(GIT_QUERY_APP_DATA, "", function(err) {
        if(err) {
            console.log(err);
        }
    })

    let queryOutput = vscode.window.createOutputChannel("GIT QUERY");
    queryOutput.clear();

    let disposable = vscode.commands.registerCommand('git-query.runner', async function () {

        queryOutput.clear();

        var config = vscode.workspace.getConfiguration('gitQuery');

        const api = new gitlab.Gitlab({
            token: config['token'],
            host: config['host']
        });

        var i;
        var returnList = [];

        api.Runners.allOwned().then(async runnerList => {
            returnList[0] = 'All Jobs';
            for(i = 1; i<runnerList.length + 1; i++) {
                returnList[i] = runnerList[i-1]["description"];
            }

            getUserInfo('Enter runner ID', returnList)
            .then(function (result) {
                vscode.window.showInformationMessage('GIT QUERY: Checking status of ' + result);

                checkRunnerStatus(result)
                .then(async runnerStatus => {
                    if (!undefined){
                        exportToJsonFile(runnerStatus);

                        if (runnerStatus.length > 0)
                        {
                            queryOutput.appendLine("GIT QUERY STATUS:");
                            for (let index = 0; index < runnerStatus.length; index++)
                            {
                                let sts = runnerStatus[index];
                                queryOutput.appendLine(sts['stage'] + ' | ' + sts['status'] + ' | ' + sts['name'] +
                                                        ' | ' + sts['started_at'] + ' | ' + sts['user']['name'] +
                                                        ' | ' + sts['web_url']);
                            }
                        }
                        else{
                            queryOutput.appendLine("GIT QUERY STATUS: Free");
                        }

                        queryOutput.show();
                    }
                });
            });
        })
        .then(undefined, err => {
            vscode.window.showErrorMessage('Cannot establish connection to the GIT server!');
        });
    });

	context.subscriptions.push(disposable);
};

/********************************************************************************\
* Name        : activate
* Called by   : external command
* Arguments   : None
* Return      : None
* Description : TBD
\********************************************************************************/
function deactivate() {}


/********************************************************************************\
* Modules
\********************************************************************************/
module.exports = {
	activate,
	deactivate
}


/*******************************************************************************
Start of Tree View logic
********************************************************************************/
// "use strict";

// var __extends = (this && __extends) || (function () {
//     var extendStatics = function (d, b) {
//         extendStatics = Object.setPrototypeOf ||
//             ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
//             function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
//         return extendStatics(d, b);
//     };
//     return function (d, b) {
//         extendStatics(d, b);
//         function __() { this.constructor = d; }
//         d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
//     };
// })();

// Object.defineProperty(exports, "__esModule", { value: true });
// exports.NodeDependenciesProvider = void 0;
// var NodeDependenciesProvider = /** @class */ (function () {
//     function NodeDependenciesProvider(workspaceRoot) {
//         this.workspaceRoot = workspaceRoot;
//     }
//     NodeDependenciesProvider.prototype.getTreeItem = function (element) {
//         return element;
//     };
//     NodeDependenciesProvider.prototype.getChildren = function (element) {
//         if (!this.workspaceRoot) {
//             vscode.window.showInformationMessage('No dependency in empty workspace');
//             return Promise.resolve([]);
//         }
//         if (element) {
//             return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'query.json')));
//         }
//         else {
//             var packageJsonPath = path.join(this.workspaceRoot, 'query.json');
//             if (this.pathExists(packageJsonPath)) {
//                 return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
//             }
//             else {
//                 vscode.window.showInformationMessage('Workspace has no query.json');
//                 return Promise.resolve([]);
//             }
//         }
//     };
//     /**
//      * Given the path to package.json, read all its dependencies and devDependencies.
//      */
//     NodeDependenciesProvider.prototype.getDepsInPackageJson = function (packageJsonPath) {
//         var _this = this;
//         if (this.pathExists(packageJsonPath)) {
//             var packageJson_1 = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
//             var toDep_1 = function (moduleName, version) {
//                 if (_this.pathExists(path.join(_this.workspaceRoot, 'node_modules', moduleName))) {
//                     return Dependency(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
//                 }
//                 else {
//                     return Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None);
//                 }
//             };
//             var deps = packageJson_1.dependencies
//                 ? Object.keys(packageJson_1.dependencies).map(function (dep) {
//                     return toDep_1(dep, packageJson_1.dependencies[dep]);
//                 })
//                 : [];
//             var devDeps = packageJson_1.devDependencies
//                 ? Object.keys(packageJson_1.devDependencies).map(function (dep) {
//                     return toDep_1(dep, packageJson_1.devDependencies[dep]);
//                 })
//                 : [];
//             return deps.concat(devDeps);
//         }
//         else {
//             return [];
//         }
//     };
//     NodeDependenciesProvider.prototype.pathExists = function (p) {
//         try {
//             fs.accessSync(p);
//         }
//         catch (err) {
//             return false;
//         }
//         return true;
//     };
//     return NodeDependenciesProvider;
// }());
// exports.NodeDependenciesProvider = NodeDependenciesProvider;
// var Dependency = /** @class */ (function (_super) {
//     __extends(Dependency, _super);
//     function Dependency(label, version, collapsibleState) {
//         var _this = _super.call(this, label, collapsibleState) || this;
//         _this.label = label;
//         _this.version = version;
//         _this.collapsibleState = collapsibleState;
//         _this.iconPath = {
//             light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
//             dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
//         };
//         _this.tooltip = _this.label + "-" + _this.version;
//         _this.description = _this.version;
//         return _this;
//     }
//     return Dependency;
// }(vscode.TreeItem));
