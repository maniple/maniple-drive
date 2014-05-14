var Templates = {
    "Uploader": "<div id=\"drive-uploader\">\n<div id=\"drive-uploader-dialog\" data-hook=\"dialog-content\">\n<div id=\"drive-uploader-dropzone\" data-hook=\"drop-zone-pane\">\n<div class=\"uploader\" data-hook=\"drop-zone\">\n<div class=\"drop-here\" data-hook=\"drop-zone-text\"></div>\n</div>\n</div>\n<div id=\"drive-uploader-queue\" data-hook=\"queue-pane\">\n<table id=\"drive-uploader-queue-items\">\n<tbody data-hook=\"items\"></tbody>\n</table>\n<div class=\"no-items-message\">{{ str.noItems }}</div>\n</div>\n</div>\n<div id=\"drive-uploader-status\">\n<div id=\"drive-uploader-status-icon\"></div>\n<div id=\"drive-uploader-status-content\">\n<h3>\n<span class=\"name\" data-hook=\"item-name\"></span>\n<span class=\"size\" data-hook=\"item-size\"></span>\n</h3>\n<p data-hook=\"status-message\"></p>\n</div>\n<div id=\"drive-uploader-status-button\">\n<button class=\"seamless\" data-hook=\"open-button\">{{ str.openButtonText }}</button>\n</div>\n</div>\n</div>",
    "Uploader.queueItem": "<tr>\n<td class=\"col-filename\">\n<span class=\"filename\">{{ file.name }}</span>\n<span class=\"error-message\" data-hook=\"error-message\"></span>\n</td>\n<td class=\"col-size\">{{ file.size | Viewtils.fsize }}</td>\n<td class=\"col-progress\">\n<span class=\"progress-text\" data-hook=\"progress-text\"></span>\n<span class=\"progress-bar\"><span class=\"bar\" data-hook=\"progress-bar\"></span></span>\n</td>\n<td class=\"col-cancel\">\n<button class=\"seamless\" data-hook=\"cancel-button\" title=\"{{ str.cancelButtonTooltip }}\"></button>\n</td>\n</tr>",
    "DirBrowser": "<div data-hook=\"disk-usage\"></div>\n<h1 id=\"title\"><span class=\"drive-dir-renamable\" data-hook=\"title\"></span></h1>\n<div id=\"opnav\">\n<div id=\"drive-loading\" class=\"abs\" data-hook=\"message-area\"></div>\n<div id=\"drive-dir-menu\" data-hook=\"aux-menu\"></div>\n</div>\n<div data-hook=\"dir-contents\"></div>\n<div data-hook=\"uploader\"></div>",
    "DirBrowser.diskUsage": "<div id=\"drive-du\">\n<div class=\"pane\">\n<div class=\"progress-bar\">\n<div class=\"bar\" data-hook=\"progress-bar\" data-level-template=\"bar-{level}\"></div>\n</div>\n<dl class=\"used\">\n<dt>{{ str.used }}</dt>\n<dd>\n<span data-hook=\"used\">{{ used | Viewtils.fsize }}</span>\n<span class=\"percent\">(<span data-hook=\"percent\"></span>%)</span>\n</dd>\n</dl>\n<dl class=\"available\">\n<dt>{{ str.available }}</dt>\n<dd data-hook=\"available\"></dd>\n</dl>\n</div>\n</div>",
    "DirBrowser.dirContents": "<div id=\"drive-dir-contents\">\n<table>\n<thead data-hook=\"header\"></thead>\n<tbody data-hook=\"updir\"></tbody>\n<tbody data-hook=\"subdirs\"></tbody>\n<tbody data-hook=\"files\"></tbody>\n</table>\n<div class=\"no-items-message\">{{ str.noItems }}</div>\n</div>",
    "DirBrowser.dirContents.header": "<tr>\n<th class=\"col-grab\"></th>\n<th class=\"col-icon\"></th>\n<th class=\"col-name\">{{ str.name }}</th>\n<th class=\"col-owner\">{{ str.owner }}</th>\n<th class=\"col-size\">{{ str.size }}</th>\n<th class=\"col-mtime\">{{ str.mtime }}</th>\n<th class=\"col-ops\"></th>\n</tr>",
    "DirBrowser.dirContents.updir": "<tr>\n<td class=\"col-grab\"></td>\n<td class=\"col-icon\"></td>\n<td class=\"col-name\" colspan=\"5\">\n<span title=\"{{ dir.name }}\" class=\"dir\" data-hook=\"name\">..</span>\n</td>\n</tr>",
    "DirBrowser.dirContents.subdir": "<tr>\n<td class=\"col-grab\" data-hook=\"grab\"></td>\n<td class=\"col-icon\"><span class=\"drive-icon drive-icon-folder\"></span></td>\n<td class=\"col-name\">\n<span title=\"{{ dir.name }}\" data-hook=\"name\">{{ dir.name }}</span>\n</td>\n<td class=\"col-owner\">{{ dir.owner.name }}</td>\n<td class=\"col-size\"></td>\n<td class=\"col-mtime\">\n<div class=\"full\">{{ dir.mtime.short }}</div>\n<div class=\"date-only\">{{ dir.mtime.date }}</div>\n</td>\n<td class=\"col-ops\" data-hook=\"ops\"></td>\n</tr>",
    "DirBrowser.dirContents.file": "<tr>\n<td class=\"col-grab\" data-hook=\"grab\"></td>\n<td class=\"col-icon\"><span class=\"drive-icon drive-icon-{{ file.filter }}\" data-hook=\"icon\"></span></td>\n<td class=\"col-name\">\n<span title=\"{{ file.name }}\" data-hook=\"name\">{{ file.name }}</span>\n</td>\n<td class=\"col-owner\">{{ file.owner.name }}</td>\n<td class=\"col-size\">{{ file.size | Viewtils.fsize }}</td>\n<td class=\"col-mtime\">\n<div class=\"full\">{{ file.mtime.short }}</div>\n<div class=\"date-only\">{{ file.mtime.date }}</div>\n</td>\n<td class=\"col-ops\" data-hook=\"ops\"></td>\n</tr>",
    "DirBrowser.opShareDir": "<div id=\"drive-dir-share\">\n<form class=\"form\">\n<div id=\"drive-dir-share-vis\">\n<label for=\"drive-dir-share-visibility\">{{ str.visLabel }}</label>\n<table>\n<tr>\n<td>\n<select name=\"visibility\" id=\"drive-dir-share-visibility\">\n<option value=\"private\">{{ str.visOptPrivate }}</option>\n<option value=\"usersonly\">{{ str.visOptUsersonly }}</option>\n<option value=\"public\">{{ str.visOptPublic }}</option>\n<option value=\"inherited\">{{ str.visOptInherited }}</option>\n</select>\n</td>\n<td style=\"padding-left:6px\">\n<div id=\"drive-dir-share-vis-desc-private\" class=\"vis-desc\">{{ str.visDescPrivate }}</div>\n<div id=\"drive-dir-share-vis-desc-usersonly\" class=\"vis-desc\">{{ str.visDescUsersonly }}</div>\n<div id=\"drive-dir-share-vis-desc-public\" class=\"vis-desc\">{{ str.visDescPublic }}</div>\n<div id=\"drive-dir-share-vis-desc-inherited\" class=\"vis-desc\">{{ str.visDescInherited }}</div>\n</td>\n</tr>\n</table>\n</div>\n<div id=\"drive-dir-share-acl\">\n<label for=\"drive-dir-share-acl-search-user\">{{ str.aclLabel }}</label>\n<div id=\"drive-dir-share-acl-users\">\n<div class=\"highlight\"></div>\n<table>\n<tbody data-hook=\"user-list\">\n<tr data-hook=\"empty-list-message\">\n<td colspan=\"3\" class=\"no-users\">{{ str.aclNoUsers }}</td>\n</tr>\n</tbody>\n</table>\n</div>\n<div id=\"drive-dir-share-acl-search\">\n<table>\n<tr>\n<td>\n<input type=\"text\" id=\"drive-dir-share-acl-search-user\" data-hook=\"user-search\" placeholder=\"{{ str.userSearch }}\" />\n</td>\n<td>\n<button type=\"button\" class=\"btn btn-primary disabled\" data-hook=\"user-add\">{{ str.userAdd }}</button>\n</td>\n</tr>\n</table>\n<div class=\"hint\">{{ str.searchHint }}</div>\n</div>\n</div>\n</form>\n</div>",
    "DirBrowser.opShareDir.user": "<tr>\n<td class=\"user-name\">\n<div class=\"user-name-fn\">{{ user.first_name }} {{ user.last_name }}</div>\n<div class=\"user-name-un\">{{ user.username }}</div>\n</td>\n<td class=\"user-perms\">\n<select name=\"shares[{{ user.id }}]\">\n<option value=\"0\">{{ str.aclRead }}</option>\n<option value=\"1\"{{# user.can_write }}selected{{/ user.can_write }}>{{ str.aclReadWrite }}</option>\n</select>\n</td>\n<td class=\"user-delete\">\n<button type=\"button\" data-hook=\"user-delete\" title=\"{{ str.userDelete }}\">&times;</button>\n</td>\n</tr>",
    "DirBrowser.opDirDetails": "<div id=\"drive-dir-details\">\n<dl>\n<dt>{{ str.name }}</dt>\n<dd>{{ dir.name }}</dd>\n<dt>{{ str.owner }}</dt>\n<dd><span class=\"owner\">{{ dir.owner.id }} ({{ dir.owner.name }})</span></dd>\n<dt>{{ str.mtime }}</dt>\n<dd>\n<div class=\"mtime timelog\">\n<span class=\"time\">{{ dir.mtime.long }}</span>\n<span class=\"sep\">{{ str.timeSeparator }}</span>\n<span class=\"user\">{{ dir.modified_by.name }}</span>\n</div>\n</dd>\n<dt>{{ str.ctime }}</dt>\n<dd>\n<div class=\"ctime timelog\">\n<span class=\"time\">{{ dir.ctime.long }}</span>\n<span class=\"sep\">{{ str.timeSeparator }}</span>\n<span class=\"user\">{{ dir.created_by.name }}</span>\n</div>\n</dd>\n</dl>\n</div>",
    "DirBrowser.opFileDetails": "<div id=\"drive-file-details\">\n<dl>\n<dt>{{ str.name }}</dt>\n<dd>{{ file.name }}</dd>\n<dt>{{ str.owner }}</dt>\n<dd><span class=\"owner\">{{ file.owner.id }} ({{ file.owner.name }})</span></dd>\n<dt>{{ str.mtime }}</dt>\n<dd>\n<div class=\"mtime timelog\">\n<span class=\"time\">{{ file.mtime.long }}</span>\n<span class=\"sep\">{{ str.timeSeparator }}</span>\n<span class=\"user\">{{ file.modified_by.name }}</span>\n</div>\n</dd>\n<dt>{{ str.ctime }}</dt>\n<dd>\n<div class=\"ctime timelog\">\n<span class=\"time\">{{ file.ctime.long }}</span>\n<span class=\"sep\">{{ str.timeSeparator }}</span>\n<span class=\"user\">{{ file.created_by.name }}</span>\n</div>\n</dd>\n<dt>ID</dt>\n<dd>{{ file.id }}</dd>\n<dt>{{ str.size }}</dt>\n<dd>{{ file.size | Viewtils.fsize }}</dd>\n<dt>{{ str.mimetype }}</dt>\n<dd>{{ file.mimetype }}</dd>\n<dt>{{ str.md5sum }}</dt>\n<dd>{{ file.md5sum }}</dd>\n<dt>{{ str.url }}</dt>\n<dd><code>{{ file.url }}</code></dd>\n</dl>\n</div>"
};
