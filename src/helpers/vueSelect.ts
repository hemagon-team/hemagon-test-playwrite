import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../data/config';

/**
 * Vue-select (vs__combobox) inside a wrapper such as #input-tournament-country.
 */
export async function selectVueSelectOption(
  wrapper: Locator,
  optionLabel: string,
): Promise<void> {
  const input = wrapper.locator('input[type="search"]');
  await input.click();
  await input.fill('');
  await input.fill(optionLabel);

  const listbox = wrapper.locator('[role="listbox"], .vs__dropdown-menu');
  const option  = listbox.getByRole('option', { name: optionLabel, exact: true });

  await expect(option).toBeVisible({ timeout: TIMEOUTS.default });
  await option.click();
}

export async function expectVueSelectValue(wrapper: Locator, label: string): Promise<void> {
  await expect(wrapper.locator('.vs__selected')).toContainText(label, { timeout: TIMEOUTS.short });
}
