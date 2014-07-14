var Templates = {
    "Uploader": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div id=\"drive-uploader\">\n<div id=\"drive-uploader-dialog\" data-hook=\"dialog-content\">\n<div id=\"drive-uploader-dropzone\" data-hook=\"drop-zone-pane\">\n<div class=\"uploader\" data-hook=\"drop-zone\">\n<div class=\"drop-here\" data-hook=\"drop-zone-text\"></div>\n</div>\n</div>\n<div id=\"drive-uploader-queue\" data-hook=\"queue-pane\">\n<table id=\"drive-uploader-queue-items\">\n<tbody data-hook=\"items\"></tbody>\n</table>\n<div class=\"no-items-message\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.noItems)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n</div>\n</div>\n<div id=\"drive-uploader-status\">\n<div id=\"drive-uploader-status-icon\"></div>\n<div id=\"drive-uploader-status-content\">\n<h3>\n<span class=\"name\" data-hook=\"item-name\"></span>\n<span class=\"size\" data-hook=\"item-size\"></span>\n</h3>\n<p data-hook=\"status-message\"></p>\n</div>\n<div id=\"drive-uploader-status-button\">\n<button class=\"seamless\" data-hook=\"open-button\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.openButtonText)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</button>\n</div>\n</div>\n</div>";
  return buffer;
  }

),
    "Uploader.queueItem": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


  buffer += "<tr>\n<td class=\"col-filename\">\n<span class=\"filename\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n<span class=\"error-message\" data-hook=\"error-message\"></span>\n</td>\n<td class=\"col-size\">"
    + escapeExpression((helper = helpers.fileSize || (depth0 && depth0.fileSize),options={hash:{},data:data},helper ? helper.call(depth0, ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.size), options) : helperMissing.call(depth0, "fileSize", ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.size), options)))
    + "</td>\n<td class=\"col-progress\">\n<span class=\"progress-text\" data-hook=\"progress-text\"></span>\n<span class=\"progress-bar\"><span class=\"bar\" data-hook=\"progress-bar\"></span></span>\n</td>\n<td class=\"col-cancel\">\n<button class=\"seamless\" data-hook=\"cancel-button\" title=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.cancelButtonTooltip)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></button>\n</td>\n</tr>";
  return buffer;
  }

),
    "DirBrowser.loading": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "Loading directory contents...";
  }

),
    "DirBrowser.main": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div id=\"drive-dirbrowser\">\n<div data-hook=\"disk-usage\"></div>\n<div id=\"drive-dirbrowser-title-outer\">\n<h1 id=\"drive-dirbrowser-title\" data-hook=\"dir-name\"></h1>\n</div>\n<div id=\"opnav\">\n<div id=\"drive-loading\" data-hook=\"message-area\"></div>\n<div id=\"drive-dir-menu\" data-hook=\"aux-menu\"></div>\n</div>\n<div data-hook=\"dir-contents\"></div>\n<div data-hook=\"uploader\"></div>\n</div>";
  }

),
    "DirBrowser.diskUsage": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


  buffer += "<div id=\"drive-du\">\n<div class=\"pane\">\n<div class=\"progress\">\n<div class=\"progress-bar\" role=\"progressbar\" data-hook=\"progress-bar\" data-level-template=\"progress-bar-{level}\"></div>\n</div>\n<dl class=\"used\">\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.used)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd>\n<span data-hook=\"used\">"
    + escapeExpression((helper = helpers.fileSize || (depth0 && depth0.fileSize),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.used), options) : helperMissing.call(depth0, "fileSize", (depth0 && depth0.used), options)))
    + "</span>\n<span class=\"percent\">(<span data-hook=\"percent\"></span>%)</span>\n</dd>\n</dl>\n<dl class=\"available\">\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.available)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd data-hook=\"available\"></dd>\n</dl>\n</div>\n</div>";
  return buffer;
  }

),
    "DirBrowser.auxMenu": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n<li><a href=\"#!\" data-op=\"";
  if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</a></li>\n";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n<li id=\"drive-more-ops\" class=\"dropdown\">\n<a href=\"#drive-more-ops\" data-toggle=\"dropdown\">\n"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.moreOps)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " <span class=\"caret\"></span>\n</a>\n<ul class=\"dropdown-menu dropdown-menu-right has-tip\">\n";
  options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}
  if (helper = helpers.moreOps) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.moreOps); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.moreOps) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>\n</li>\n";
  return buffer;
  }

  buffer += "<ul>\n";
  options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}
  if (helper = helpers.ops) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.ops); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.ops) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.moreOps)),stack1 == null || stack1 === false ? stack1 : stack1.length), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>";
  return buffer;
  }

),
    "DirBrowser.dirContents": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div id=\"drive-dir-contents\">\n<div>\n<ul class=\"dir-entries\" data-hook=\"header\"></ul>\n<ul class=\"dir-entries\" data-hook=\"updir\"></ul>\n<ul class=\"dir-entries\" data-hook=\"subdirs\"></ul>\n<ul class=\"dir-entries\" data-hook=\"files\"></ul>\n</div>\n<div class=\"no-items-message\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.noItems)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n</div>";
  return buffer;
  }

),
    "DirBrowser.dirContents.header": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"dir-entry dir-entry-header\">\n<div class=\"col-grab\"></div>\n<div class=\"col-name\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div class=\"col-owner\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div class=\"col-size\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.size)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div class=\"col-mtime\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div class=\"col-ops\"></div>\n</div>";
  return buffer;
  }

),
    "DirBrowser.dirContents.updir": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"dir-entry dir-entry-updir\">\n<div class=\"col-grab\"></div>\n<div class=\"col-name\">\n<span class=\"dir-entry-icon\">\n<span class=\"drive-icon drive-icon-updir\" data-hook=\"icon\"></span>\n</span>\n<span class=\"dir-entry-name\" title=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" data-hook=\"name\">..</span>\n</div>\n</div>";
  return buffer;
  }

),
    "DirBrowser.dirContents.subdir": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n<div class=\"dropdown\">\n<div data-toggle=\"dropdown\" class=\"dropdown-toggle\"><span class=\"caret\"></span></div>\n<ul class=\"dropdown-menu dropdown-menu-right has-tip\">\n";
  stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.open)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data}));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.share)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data}));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.rename)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data}));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.details)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data}));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.remove)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data}));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>\n</div>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n<li><a href=\"#!\" data-op=\"";
  if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</a></li>\n";
  return buffer;
  }

function program4(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n<li class=\"divider\"></li>\n<li><a href=\"#!\" data-op=\"";
  if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</a></li>\n";
  return buffer;
  }

  buffer += "<div class=\"dir-entry dir-entry-subdir\">\n<div class=\"col-grab\" data-hook=\"grab\"></div>\n<div class=\"col-name\" data-hook=\"name\">\n<span class=\"dir-entry-icon\">\n<span class=\"drive-icon drive-icon-folder\" data-hook=\"icon\"></span>\n</span>\n<span class=\"dir-entry-name\" title=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n</div>\n<div class=\"col-owner\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div class=\"col-size\"></div>\n<div class=\"col-mtime\">\n<div class=\"full\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),stack1 == null || stack1 === false ? stack1 : stack1['short'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div class=\"date-only\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),stack1 == null || stack1 === false ? stack1 : stack1.date)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n</div>\n<div class=\"col-ops\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.ops), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n</div>";
  return buffer;
  }

),
    "DirBrowser.dirContents.file": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n<img src=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.thumb_url)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" alt=\"\" />\n";
  return buffer;
  }

function program3(depth0,data) {
  
  
  return "\n<span class=\"drive-icon\"></span>\n";
  }

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.author)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n";
  return buffer;
  }

function program7(depth0,data) {
  
  
  return "\n<i>Brak autora / źródła</i>\n";
  }

function program9(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.description)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n";
  return buffer;
  }

function program11(depth0,data) {
  
  
  return "\n<i>Brak opisu</i>\n";
  }

function program13(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n<div class=\"dropdown\">\n<div data-toggle=\"dropdown\" class=\"dropdown-toggle\"><span class=\"caret\"></span></div>\n<ul class=\"dropdown-menu dropdown-menu-right has-tip\">\n";
  stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.open)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data}));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.edit)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data}));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.rename)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data}));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.details)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data}));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.remove)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data}));
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>\n</div>\n";
  return buffer;
  }
function program14(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n<li><a href=\"#!\" data-op=\"";
  if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</a></li>\n";
  return buffer;
  }

function program16(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n<li class=\"divider\"></li>\n<li><a href=\"#!\" data-op=\"";
  if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</a></li>\n";
  return buffer;
  }

  buffer += "<div class=\"dir-entry dir-entry-file\">\n<div class=\"col-grab\" data-hook=\"grab\"></div>\n<div class=\"col-name\">\n<a href=\"#!\" data-hook=\"name\" title=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">\n<span class=\"dir-entry-icon\" data-hook=\"icon\">\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.thumb_url), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</span>\n<span class=\"dir-entry-name\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n</a>\n</div>\n<div class=\"col-cmeta\">\n<div class=\"title\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.title)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div class=\"author\">\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.author), {hash:{},inverse:self.program(7, program7, data),fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n<div class=\"desc\">\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.description), {hash:{},inverse:self.program(11, program11, data),fn:self.program(9, program9, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n</div>\n<div class=\"col-owner\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div class=\"col-size\">"
    + escapeExpression((helper = helpers.fileSize || (depth0 && depth0.fileSize),options={hash:{},data:data},helper ? helper.call(depth0, ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.size), options) : helperMissing.call(depth0, "fileSize", ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.size), options)))
    + "</div>\n<div class=\"col-mtime\">\n<div class=\"full\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),stack1 == null || stack1 === false ? stack1 : stack1['short'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div class=\"date-only\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),stack1 == null || stack1 === false ? stack1 : stack1.date)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n</div>\n<div class=\"col-ops\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.ops), {hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n</div>";
  return buffer;
  }

),
    "DirBrowser.nameForm": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return " has-error";
  }

function program3(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n<div class=\"message-block\">\n<ul class=\"errors\">\n";
  options={hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data}
  if (helper = helpers.errors) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.errors); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.errors) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>\n";
  return buffer;
  }
function program4(depth0,data) {
  
  var buffer = "";
  buffer += "\n<li>"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</li>\n";
  return buffer;
  }

  buffer += "<form method=\"post\">\n<div class=\"form-group";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.errors), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\">\n<label class=\"required\" for=\"drive-dir-form-name\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.nameLabel)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</label>\n<input type=\"text\" name=\"name\" class=\"form-control\" value=\"";
  if (helper = helpers.value) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.value); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" autocomplete=\"off\" id=\"drive-dir-form-name\" />\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.errors), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n</form>";
  return buffer;
  }

),
    "DirBrowser.opShareDir": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div id=\"drive-dir-share\">\n<form class=\"form\">\n<div id=\"drive-dir-share-vis\">\n<label for=\"drive-dir-share-visibility\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visLabel)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</label>\n<table>\n<tr>\n<td>\n<select name=\"visibility\" id=\"drive-dir-share-visibility\">\n<option value=\"private\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visOptPrivate)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</option>\n<option value=\"usersonly\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visOptUsersonly)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</option>\n<option value=\"public\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visOptPublic)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</option>\n<option value=\"inherited\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visOptInherited)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</option>\n</select>\n</td>\n<td style=\"padding-left:6px\">\n<div id=\"drive-dir-share-vis-desc-private\" class=\"vis-desc\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visDescPrivate)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div id=\"drive-dir-share-vis-desc-usersonly\" class=\"vis-desc\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visDescUsersonly)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div id=\"drive-dir-share-vis-desc-public\" class=\"vis-desc\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visDescPublic)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div id=\"drive-dir-share-vis-desc-inherited\" class=\"vis-desc\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visDescInherited)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n</td>\n</tr>\n</table>\n</div>\n<div id=\"drive-dir-share-acl\">\n<label for=\"drive-dir-share-acl-search-user\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.aclLabel)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</label>\n<div id=\"drive-dir-share-acl-users\">\n<div class=\"highlight\"></div>\n<table>\n<tbody data-hook=\"user-list\">\n<tr data-hook=\"empty-list-message\">\n<td id=\"drive-dir-share-acl-no-users\" colspan=\"3\"></td>\n</tr>\n</tbody>\n</table>\n</div>\n<div id=\"drive-dir-share-acl-search\">\n<table>\n<tr>\n<td>\n<input type=\"text\" id=\"drive-dir-share-acl-search-user\" data-hook=\"user-search\" placeholder=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.userSearch)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" />\n</td>\n<td>\n<button type=\"button\" class=\"btn btn-primary disabled\" data-hook=\"user-add\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.userAdd)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</button>\n</td>\n</tr>\n</table>\n<div class=\"hint\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.searchHint)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n</div>\n</div>\n</form>\n</div>";
  return buffer;
  }

),
    "DirBrowser.opShareDir.user": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  
  return "selected";
  }

  buffer += "<tr>\n<td class=\"user-name\">\n<div class=\"user-name-fn\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.first_name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.last_name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n<div class=\"user-name-un\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.username)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n</td>\n<td class=\"user-perms\">\n<select name=\"shares["
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.user_id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "]\">\n<option value=\"0\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.aclRead)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</option>\n<option value=\"1\"";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.can_write), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.aclReadWrite)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</option>\n</select>\n</td>\n<td class=\"user-delete\">\n<button type=\"button\" data-hook=\"user-delete\" title=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.userDelete)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">&times;</button>\n</td>\n</tr>";
  return buffer;
  }

),
    "DirBrowser.opShareDir.userAutocomplete": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += " ("
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.username)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")";
  return buffer;
  }

  buffer += escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.first_name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.last_name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.username), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  return buffer;
  }

),
    "DirBrowser.opDirDetails": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div id=\"drive-dir-details\">\n<dl>\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dd>\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd><span class=\"owner\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),stack1 == null || stack1 === false ? stack1 : stack1.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " ("
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")</span></dd>\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd>\n<div class=\"mtime timelog\">\n<span class=\"time\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),stack1 == null || stack1 === false ? stack1 : stack1['long'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n<span class=\"sep\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.timeSeparator)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n<span class=\"user\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.modified_by)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n</div>\n</dd>\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.ctime)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd>\n<div class=\"ctime timelog\">\n<span class=\"time\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.ctime)),stack1 == null || stack1 === false ? stack1 : stack1['long'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n<span class=\"sep\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.timeSeparator)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n<span class=\"user\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.created_by)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n</div>\n</dd>\n</dl>\n</div>";
  return buffer;
  }

),
    "DirBrowser.opFileDetails": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.url)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd><code>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.url)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</code></dd>\n";
  return buffer;
  }

  buffer += "<div id=\"drive-file-details\">\n<dl>\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dd>\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd><span class=\"owner\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),stack1 == null || stack1 === false ? stack1 : stack1.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " ("
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")</span></dd>\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd>\n<div class=\"mtime timelog\">\n<span class=\"time\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),stack1 == null || stack1 === false ? stack1 : stack1['long'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n<span class=\"sep\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.timeSeparator)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n<span class=\"user\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.modified_by)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n</div>\n</dd>\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.ctime)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd>\n<div class=\"ctime timelog\">\n<span class=\"time\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.ctime)),stack1 == null || stack1 === false ? stack1 : stack1['long'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n<span class=\"sep\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.timeSeparator)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n<span class=\"user\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.created_by)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n</div>\n</dd>\n<dt>ID</dt>\n<dd>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dd>\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.size)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd>"
    + escapeExpression((helper = helpers.fileSize || (depth0 && depth0.fileSize),options={hash:{},data:data},helper ? helper.call(depth0, ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.size), options) : helperMissing.call(depth0, "fileSize", ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.size), options)))
    + "</dd>\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.mimetype)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.mimetype)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dd>\n<dt>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.md5sum)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dt>\n<dd>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.md5sum)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dd>\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.url), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</dl>\n</div>";
  return buffer;
  }

)
};
