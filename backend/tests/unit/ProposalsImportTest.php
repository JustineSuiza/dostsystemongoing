<?php

use App\Controllers\Proposals;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
final class ProposalsImportTest extends CIUnitTestCase
{
    public function testHasImportableRowsDetectsMeaningfulRows(): void
    {
        $this->assertTrue(Proposals::hasImportableRows([['projectTitle' => 'Sample Project']]));
        $this->assertTrue(Proposals::hasImportableRows([['programTitle' => 'Sample Program']]));
        $this->assertFalse(Proposals::hasImportableRows([['projectTitle' => '', 'programTitle' => '']]));
        $this->assertFalse(Proposals::hasImportableRows([['foo' => 'bar']]));
        $this->assertFalse(Proposals::hasImportableRows([]));
    }
}
