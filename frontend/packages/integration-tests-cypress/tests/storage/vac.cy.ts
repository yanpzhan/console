import { testName, checkErrors } from '../../support';
import * as common from '../../views/common';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';

const VAC_YAML_AWS = `
apiVersion: storage.k8s.io/v1
kind: VolumeAttributesClass
metadata:
  name: vac-aws
driverName: ebs.csi.aws.com
parameters:
  iops: '3000'
  throughput: '50'
`;
const VAC_YAML_GCP = `
apiVersion: storage.k8s.io/v1
kind: VolumeAttributesClass
metadata:
  name: vac-gcp
driverName: pd.csi.storage.gke.io
parameters:
  provisioned-iops: '3000'
  provisioned-throughput: '50'
`;
describe('Test VolumeAttributesClasses', () => {
  before(() => {
    cy.exec(`oc get infrastructure cluster --template={{.status.platform}}`).then((result) => {
      if (result.stdout !== 'AWS' && result.stdout !== 'GCP') {
        throw new Error('Test is only supported on AWS or GCP');
      } else if (result.stdout === 'AWS') {
        cy.exec(`echo '${VAC_YAML_AWS}' | oc apply -f -`);
      } else if (result.stdout === 'GCP') {
        cy.exec(`echo '${VAC_YAML_GCP}' | oc apply -f -`);
      }
    });
    cy.createProjectWithCLI(testName);
    cy.login();
  });
  afterEach(() => {
    checkErrors();
  });
  after(() => {
    cy.deleteProjectWithCLI(testName);
  });
  it(`Create VAC`, () => {
    cy.log('Create VAC');
    common.createResourceWithDefaultYAML('storage.k8s.io~v1~VolumeAttributesClass');
    detailsPage.titleShouldContain('example');
    cy.get('dd[data-test-selector="details-item-value__Driver name"]').should(
      'have.text',
      'my-driver',
    );
    cy.get('dd[data-test-selector="details-item-value__Parameters"]').should(
      'have.text',
      'Provisioned-iops',
    );
    cy.get('dd[data-test-selector="details-item-value__Parameters"]').should(
      'have.text',
      'Provisioned-throughput',
    );
    cy.get('dd[data-test-selector="details-item-value__Parameters"]').should('have.text', '3000');
    cy.get('dd[data-test-selector="details-item-value__Parameters"]').should('have.text', '50');
  });
  it(`VAC list`, () => {
    cy.log('VAC list');
    nav.sidenav.clickNavLink(['Storage', 'VolumeAttributesClasses']);
    listPage.rows.shouldBeLoaded();
    listPage.rows.shouldExist('example');
  });
  it(`add VAC when create PVC`, () => {
    cy.log('add VAC when create PVC');
    nav.sidenav.clickNavLink(['Storage', 'Persistent Volume Claims']);
    common.projectDropdown.selectProject(testName);
    listPage.clickCreateYAMLbutton();
    cy.get('#volumeattributesclass-dropdown').click();
    cy.get('.co-resource-item__resource-name').contains('example').click();
    cy.get('#pvc-name').type('example-pvc');
    cy.byLegacyTestID('Increment').click();
    modal.submit();
    detailsPage.titleShouldContain('example-pvc');
    cy.byTestID('example').should('have.text', 'example');
  });
  it(`Delete VAC`, () => {
    cy.log('Delete VAC');
    nav.sidenav.clickNavLink(['Storage', 'VolumeAttributesClasses']);
    listPage.rows.clickKebabAction('example', 'Delete VolumeAttributesClass');
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
    listPage.rows.shouldNotExist('example');
  });
});
