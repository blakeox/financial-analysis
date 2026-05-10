export {};

const STORAGE_KEY = 'fanalyx-journey-state-auto-lease-decision';

type PersistedSection = Record<string, string>;
type JourneyState = {
  collectedData?: Record<string, PersistedSection>;
};

const readJourneyState = (): JourneyState => {
  const rawState = localStorage.getItem(STORAGE_KEY);
  if (!rawState) return {};

  try {
    const parsed: unknown = JSON.parse(rawState);
    return parsed && typeof parsed === 'object' ? (parsed as JourneyState) : {};
  } catch {
    return {};
  }
};

const normalizeSection = (value: unknown): PersistedSection | null => {
  if (!value || typeof value !== 'object') return null;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
      key,
      entryValue === undefined || entryValue === null ? '' : String(entryValue),
    ])
  );
};

const hydrateForm = () => {
  if (typeof window === 'undefined') return;

  const journeyState = readJourneyState();
  const profile = normalizeSection(journeyState.collectedData?.['lease-profile']);
  if (!profile) return;

  Object.entries(profile).forEach(([key, value]) => {
    const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `[name="${key}"]`
    );
    if (input) {
      input.value = value;
    }
  });

  const statusEl = document.getElementById('lease-profile-status');
  if (statusEl) statusEl.textContent = 'Loaded from last session';
};

const persistProfile = (form: HTMLFormElement, options?: { showStatus?: boolean }) => {
  const formData = new FormData(form);
  const profile: PersistedSection = Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, typeof value === 'string' ? value : value.name])
  );

  const journeyState = readJourneyState();

  if (!journeyState.collectedData || typeof journeyState.collectedData !== 'object') {
    journeyState.collectedData = {};
  }
  journeyState.collectedData['lease-profile'] = profile;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journeyState));

  if (options?.showStatus) {
    const statusEl = document.getElementById('lease-profile-status');
    if (statusEl) {
      statusEl.textContent = 'Saved ✓';
      statusEl.className = 'text-sm text-emerald-700 dark:text-emerald-300';
    }
  }
};

const scheduleAutosave = (() => {
  let timeoutId: number | null = null;
  return (form: HTMLFormElement) => {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      persistProfile(form);
    }, 150);
  };
})();

const saveProfile = (event: SubmitEvent) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  persistProfile(form, { showStatus: true });
};

const leaseProfileForm = document.getElementById('lease-profile-form');
if (leaseProfileForm instanceof HTMLFormElement) {
  leaseProfileForm.addEventListener('submit', saveProfile);
  leaseProfileForm.addEventListener('input', () => scheduleAutosave(leaseProfileForm));
  leaseProfileForm.addEventListener('change', () => scheduleAutosave(leaseProfileForm));
  document.addEventListener('click', () => scheduleAutosave(leaseProfileForm));
}

hydrateForm();
