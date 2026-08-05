<?php
defined('MOODLE_INTERNAL') || die();

$THEME->name = 'dms';
$THEME->parents = ['boost'];
$THEME->sheets = ['dms'];
$THEME->editor_sheets = ['dms'];
$THEME->scss = function($theme) {
    return file_get_contents(__DIR__ . '/scss/dms.scss');
};
