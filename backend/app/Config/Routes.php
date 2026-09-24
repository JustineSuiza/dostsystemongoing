<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
// $routes->get('/', 'Home::index');
$routes->resource('Proposals');
$routes->resource('Projects');
$routes->resource('Releases');
$routes->resource('CounterpartFund');
$routes->resource('SixPS');
$routes->resource('UploadFile');

$routes->get('GetImage/(:segment)', 'UploadFile::showImage/$1');
$routes->get('GetFile/(:segment)', 'UploadFile::showFile/$1');

$routes->options('(:any)', 'Preflight::options');

$routes->resource('Signup');
$routes->resource('Login');
$routes->resource('CheckLoggedIn');
$routes->resource('Logout');
$routes->resource('Accounts');
$routes->resource('ForgotPassword');

$routes->resource('ArchiveProposals');
$routes->resource('ArchiveProjects');
$routes->resource('ArchiveReleases');
$routes->resource('ArchiveCounterpartFund');

$routes->post('sendEmail', 'EmailController::sendEmail');

$routes->post('checkEmail', 'EmailController::checkEmail');

$routes->post('resetPassword', 'EmailController::resetPassword');

$routes->post('ImportProjects', 'Projects::importProjects');

$routes->post('ImportCounterpartFunds', 'CounterpartFund::importCounterpartFunds');

$routes->post('ImportBudgets', 'Projects::importBudgets');

$routes->post('ImportReleases', 'Releases::importReleases');

$routes->post('ImportProposals', 'Proposals::importProposals');

$routes->post('ImportFutureSandTDirections', 'FutureSandTDirections::importDirections');

$routes->resource('FutureSandTDirections');

$routes->resource('IndirectCostSummary');
$routes->post('IndirectCostSummary/bulkSave', 'IndirectCostSummary::bulkSave');

$routes->get('DisbursementVoucher/byIndirectCost/(:num)', 'DisbursementVoucher::getByIndirectCost/$1');
$routes->post('DisbursementVoucher/bulkSave', 'DisbursementVoucher::bulkSave');
$routes->resource('DisbursementVoucher');

$routes->post('upload', 'Upload::create');
$routes->resource('Upload');