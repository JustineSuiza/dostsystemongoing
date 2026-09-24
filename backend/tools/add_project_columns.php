<?php
$mysqli = new mysqli('localhost','root','','dost-dev-db');
if ($mysqli->connect_error) {
    echo 'CONNECT_ERR:'.$mysqli->connect_error.PHP_EOL;
    exit(1);
}
$cols = [
    'bannerProgram' => 'VARCHAR(255) NULL',
    'pillar' => 'VARCHAR(255) NULL',
    'strategy' => 'TEXT NULL',
];
foreach ($cols as $c => $def) {
    $res = $mysqli->query("SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='dost-dev-db' AND TABLE_NAME='projects_tbl' AND COLUMN_NAME='".$mysqli->real_escape_string($c)."'");
    if (!$res) {
        echo 'QUERY_ERR: '.$mysqli->error.PHP_EOL;
        continue;
    }
    $row = $res->fetch_assoc();
    if ($row['cnt'] == 0) {
        if (!$mysqli->query("ALTER TABLE projects_tbl ADD COLUMN $c $def")) {
            echo 'FAILED '.$c.': '.$mysqli->error.PHP_EOL;
        } else {
            echo 'ADDED '.$c.PHP_EOL;
        }
    } else {
        echo 'EXISTS '.$c.PHP_EOL;
    }
}
$mysqli->close();
