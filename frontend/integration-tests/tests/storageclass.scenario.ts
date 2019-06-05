import { $, $$, browser, ExpectedConditions as until, element, by } from 'protractor';
import { appHost, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import { execSync } from 'child_process';

describe('Create storage class', () => {
  const scName = 'test-sc';
  const nameField = $('#storage-class-name');
  afterEach(() => {
    checkLogs();
    checkErrors();
  });
  afterAll(() => {
    try {
      execSync(`kubectl delete sc ${scName}`);
    } catch (error) {
      console.error(`Failed to delete storage class ${scName}:\n${error}`);
    }
  });

  it('Create storage class from form', async() => {
    await browser.get(`${appHost}/k8s/cluster/storageclasses`);
    await browser.wait(until.presenceOf(crudView.createYAMLButton));
    await crudView.createYAMLButton.click();
    await crudView.isLoaded;
    await browser.wait(until.presenceOf(nameField));
    await nameField.sendKeys(scName);
    await $$('.caret').get(1).click();
    await $('#local-link').click();
    await crudView.saveChangesBtn.click();
    await crudView.isLoaded();
    const nameInfo = element(by.cssContainingText('.co-resource-item__resource-name', `${scName}`));
    const provisionInfo = element(by.cssContainingText('.col-xs-6', 'kubernetes.io/no-provisioner'));
    expect(nameInfo.isPresent()).toBe(true);
    expect(provisionInfo.isPresent()).toBe(true);
  });
});
