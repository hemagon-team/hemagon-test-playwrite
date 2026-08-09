import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../../data/tournamentData';
import {
  formatTournamentDateToday,
  TOURNAMENT_UI_FORM,
  uniqueTournamentUiFields,
} from '../../data/tournamentUiData';
import { expectVueSelectValue, selectVueSelectOption } from '../../helpers/vueSelect';
import { tournamentFormSelectors } from '../selectors';

export interface TournamentSettingsFormData {
  title:           string;
  slug:            string;
  startDate:       string;
  endDate:         string;
  country:         string;
  city:            string;
  description:     string;
  paymentInfo:     string;
  rulesUrl:        string;
  rulesLabel:      string;
  siteUrl:         string;
  siteLabel:       string;
  stream:          string;
}

export function buildTournamentSettingsFormData(): TournamentSettingsFormData {
  const { title, slug } = uniqueTournamentUiFields();
  const today           = formatTournamentDateToday();

  return {
    title,
    slug,
    startDate:   today,
    endDate:     today,
    country:     TOURNAMENT_UI_FORM.country,
    city:        TOURNAMENT_UI_FORM.city,
    description: TOURNAMENT_UI_FORM.description,
    paymentInfo: TOURNAMENT_UI_FORM.paymentInfo,
    rulesUrl:    TOURNAMENT_UI_FORM.rulesUrl,
    rulesLabel:  TOURNAMENT_UI_FORM.rulesLabel,
    siteUrl:     TOURNAMENT_UI_FORM.siteUrl,
    siteLabel:   TOURNAMENT_UI_FORM.siteLabel,
    stream:      TOURNAMENT_UI_FORM.stream,
  };
}

export class TournamentSettingsFormSection {
  private readonly testTournamentRadio: Locator;
  private readonly realTournamentRadio: Locator;
  private readonly titleInput:          Locator;
  private readonly slugInput:           Locator;
  private readonly startDateInput:      Locator;
  private readonly endDateInput:        Locator;
  private readonly countryWrapper:      Locator;
  private readonly cityWrapper:         Locator;
  private readonly descriptionTextarea: Locator;
  private readonly paymentCheckbox:     Locator;
  private readonly rulesCheckbox:       Locator;
  private readonly siteCheckbox:        Locator;
  private readonly streamInput:         Locator;
  private readonly saveButton:          Locator;

  constructor(private readonly page: Page) {
    this.testTournamentRadio = page.locator(tournamentFormSelectors.testTournamentRadio);
    this.realTournamentRadio = page.locator(tournamentFormSelectors.realTournamentRadio);
    this.titleInput          = page.locator(tournamentFormSelectors.titleInput);
    this.slugInput           = page.locator(tournamentFormSelectors.slugInput);
    this.startDateInput      = page.locator(tournamentFormSelectors.startDateInput);
    this.endDateInput        = page.locator(tournamentFormSelectors.endDateInput);
    this.countryWrapper      = page.locator(tournamentFormSelectors.countryWrapper);
    this.cityWrapper         = page.locator(tournamentFormSelectors.cityWrapper);
    this.descriptionTextarea = page.locator(tournamentFormSelectors.descriptionTextarea).first();
    this.paymentCheckbox     = page.locator(tournamentFormSelectors.paymentCheckbox);
    this.rulesCheckbox       = page.locator(tournamentFormSelectors.rulesCheckbox);
    this.siteCheckbox        = page.getByRole('checkbox', { name: /Link to your website/i });
    this.streamInput         = page.locator(tournamentFormSelectors.streamInput);
    this.saveButton          = page.locator(tournamentFormSelectors.saveButton);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.testTournamentRadio).toBeVisible({ timeout: TIMEOUTS.long });
    await expect(this.titleInput).toBeVisible();
    await expect(this.slugInput).toBeVisible();
    await expect(this.countryWrapper).toBeVisible();
    await expect(this.cityWrapper).toBeVisible();
  }

  async fill(data: TournamentSettingsFormData): Promise<void> {
    await this.chooseTestingPurpose();

    await this.titleInput.fill(data.title);
    await this.slugInput.fill(data.slug);

    await this.startDateInput.fill(data.startDate);
    await this.endDateInput.fill(data.endDate);

    await selectVueSelectOption(this.countryWrapper, data.country);
    await selectVueSelectOption(this.cityWrapper, data.city);

    await this.descriptionTextarea.fill(data.description);

    await this.paymentCheckbox.check();
    await expect(this.paymentTextarea()).toBeVisible({ timeout: TIMEOUTS.short });
    await this.paymentTextarea().fill(data.paymentInfo);

    await this.rulesCheckbox.check();
    await expect(this.linkUrlInputs().first()).toBeVisible({ timeout: TIMEOUTS.short });
    await this.linkUrlInputs().nth(0).fill(data.rulesUrl);
    await this.linkLabelInputs().nth(0).fill(data.rulesLabel);

    await this.siteCheckbox.check();
    await expect(this.linkUrlInputs().nth(1)).toBeVisible({ timeout: TIMEOUTS.short });
    await this.linkUrlInputs().nth(1).fill(data.siteUrl);
    await this.linkLabelInputs().nth(1).fill(data.siteLabel);

    await this.streamInput.fill(data.stream);
  }

  async expectValues(data: TournamentSettingsFormData): Promise<void> {
    await expect(this.testTournamentRadio).toBeChecked();
    await expect(this.titleInput).toHaveValue(data.title);
    await expect(this.slugInput).toHaveValue(data.slug);
    await expect(this.startDateInput).toHaveValue(data.startDate);
    await expect(this.endDateInput).toHaveValue(data.endDate);

    await expectVueSelectValue(this.countryWrapper, data.country);
    await expectVueSelectValue(this.cityWrapper, data.city);

    await expect(this.descriptionTextarea).toHaveValue(data.description);
    await expect(this.paymentCheckbox).toBeChecked();
    await expect(this.paymentTextarea()).toHaveValue(data.paymentInfo);

    await expect(this.rulesCheckbox).toBeChecked();
    await expect(this.linkUrlInputs().nth(0)).toHaveValue(data.rulesUrl);
    await expect(this.linkLabelInputs().nth(0)).toHaveValue(data.rulesLabel);

    await expect(this.siteCheckbox).toBeChecked();
    await expect(this.linkUrlInputs().nth(1)).toHaveValue(data.siteUrl);
    await expect(this.linkLabelInputs().nth(1)).toHaveValue(data.siteLabel);

    await expect(this.streamInput).toHaveValue(data.stream);
  }

  async submit(): Promise<void> {
    await expect(this.saveButton).toBeEnabled({ timeout: TIMEOUTS.short });
    await this.saveButton.click();
  }

  /** Tournament Purpose: Testing — always selected for autotest tournaments. */
  private async chooseTestingPurpose(): Promise<void> {
    if (!TOURNAMENT_PURPOSE_IS_TESTING) {
      throw new Error('Autotests require Tournament Purpose: Testing');
    }
    if (await this.realTournamentRadio.isChecked()) {
      await this.testTournamentRadio.check();
    }
    await expect(this.testTournamentRadio).toBeChecked();
  }

  private paymentTextarea(): Locator {
    return this.page.locator('#input-tournament-description').nth(1);
  }

  private linkUrlInputs(): Locator {
    return this.page.locator('#input-tournament-link-url');
  }

  private linkLabelInputs(): Locator {
    return this.page.locator('#input-tournament-link-label');
  }
}
