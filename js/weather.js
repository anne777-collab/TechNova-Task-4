import { OPENWEATHER_API_KEY } from "./config.js";
import { readStorage, writeStorage } from "./storage.js";

const STORAGE_KEYS = {
  lastCity: "technova-weather-last-city"
};

const API_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const BUTTON_LABEL_DEFAULT = "Search Weather";
const BUTTON_LABEL_LOADING = "Searching\u2026";
const TOAST_DURATION_MS = 3500;

const toSafeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normalizeCity = (value) => String(value || "").trim().replace(/\s+/g, " ");

const formatTemperature = (value) => {
  const num = toSafeNumber(value);
  return num !== null ? `${Math.round(num)}\u00B0C` : "--";
};

const formatHumidity = (value) => {
  const num = toSafeNumber(value);
  return num !== null ? `${Math.round(num)}%` : "--";
};

const formatPressure = (value) => {
  const num = toSafeNumber(value);
  return num !== null ? `${Math.round(num)} hPa` : "--";
};

const formatVisibility = (value) => {
  const num = toSafeNumber(value);
  if (num === null) return "--";
  return num >= 1000 ? `${Math.round(num / 1000)} km` : `${Math.round(num)} m`;
};

const formatWindSpeed = (value) => {
  const num = toSafeNumber(value);
  return num !== null ? `${num.toFixed(1)} m/s` : "--";
};

const formatLocalTime = (unixSeconds, timezoneOffsetSeconds) => {
  const timestamp = toSafeNumber(unixSeconds);
  const offset = toSafeNumber(timezoneOffsetSeconds) ?? 0;
  if (timestamp === null) return "--";

  const date = new Date((timestamp + offset) * 1000);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC"
  }).format(date);
};

const formatLastUpdated = () => {
  return `Last updated: ${new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date())}`;
};

const buildIconUrl = (iconCode) =>
  iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : "";

const initWeatherPage = () => {
  const form = document.querySelector("[data-weather-form]");
  const input = document.querySelector("#weather-city");
  const submitBtn = form?.querySelector(".weather-search-form__submit");
  const recentButtons = document.querySelectorAll("[data-weather-recent]");

  const fieldMsg = document.querySelector("[data-weather-field-msg]");
  const toastRegion = document.querySelector("[data-toast-region]");

  const resultCard = document.querySelector("[data-weather-result]");
  const cityTitle = document.querySelector("[data-weather-city]");
  const descriptionText = document.querySelector("[data-weather-description]");
  const temperatureText = document.querySelector("[data-weather-temperature]");
  const feelsLikeText = document.querySelector("[data-weather-feels-like]");
  const updatedText = document.querySelector("[data-weather-updated]");
  const metricValues = {
    temperature: document.querySelector('[data-weather-metric="temperature"]'),
    feelsLike: document.querySelector('[data-weather-metric="feelsLike"]'),
    humidity: document.querySelector('[data-weather-metric="humidity"]'),
    windSpeed: document.querySelector('[data-weather-metric="windSpeed"]'),
    pressure: document.querySelector('[data-weather-metric="pressure"]'),
    visibility: document.querySelector('[data-weather-metric="visibility"]'),
    sunrise: document.querySelector('[data-weather-metric="sunrise"]'),
    sunset: document.querySelector('[data-weather-metric="sunset"]'),
    description: document.querySelector('[data-weather-metric="description"]')
  };
  const iconImage = document.querySelector("[data-weather-icon]");

  if (!form || !input || !submitBtn || !resultCard) return;

  let activeRequestController = null;
  let latestRequestId = 0;
  let lastSearchedCity = "";
  let activeToastTimer = null;

  const setHidden = (el, hidden) => {
    if (el) el.hidden = hidden;
  };

  const setText = (el, value) => {
    if (el) el.textContent = value;
  };

  const showToast = (message) => {
    if (!toastRegion) return;

    if (activeToastTimer) {
      clearTimeout(activeToastTimer);
      activeToastTimer = null;
    }

    toastRegion.querySelectorAll("[data-weather-toast]").forEach((el) => el.remove());

    const toast = document.createElement("div");
    toast.className = "toast toast--error";
    toast.setAttribute("role", "status");
    toast.setAttribute("data-weather-toast", "");
    toast.textContent = message;
    toastRegion.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    activeToastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.addEventListener("transitionend", () => toast.remove(), { once: true });
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 400);
      activeToastTimer = null;
    }, TOAST_DURATION_MS);
  };

  const dismissToast = () => {
    if (!toastRegion) return;
    if (activeToastTimer) {
      clearTimeout(activeToastTimer);
      activeToastTimer = null;
    }
    toastRegion.querySelectorAll("[data-weather-toast]").forEach((el) => {
      el.classList.remove("is-visible");
      el.addEventListener("transitionend", () => el.remove(), { once: true });
      setTimeout(() => { if (el.parentNode) el.remove(); }, 400);
    });
  };

  const setButtonLoading = (loading) => {
    submitBtn.disabled = loading;

    if (loading) {
      submitBtn.innerHTML = "";
      const spinner = document.createElement("span");
      spinner.className = "weather-btn-spinner";
      spinner.setAttribute("aria-hidden", "true");
      submitBtn.appendChild(spinner);
      submitBtn.appendChild(document.createTextNode(BUTTON_LABEL_LOADING));
    } else {
      submitBtn.innerHTML = "";
      submitBtn.textContent = BUTTON_LABEL_DEFAULT;
    }
  };

  const clearFieldMsg = () => {
    if (fieldMsg) {
      fieldMsg.hidden = true;
      fieldMsg.textContent = "";
      fieldMsg.className = "weather-inline-msg";
    }
    input.classList.remove("is-invalid");
  };

  const showFieldMsg = (text) => {
    if (!fieldMsg) return;
    clearFieldMsg();
    fieldMsg.className = "weather-inline-msg weather-inline-msg--error";
    fieldMsg.textContent = text;
    fieldMsg.hidden = false;
    input.classList.add("is-invalid");
  };

  const resetWeatherState = () => {
    clearFieldMsg();
    dismissToast();
    setHidden(resultCard, true);
    setButtonLoading(false);
  };

  const populateWeatherFields = (data) => {
    const weather = Array.isArray(data.weather) ? data.weather[0] : null;
    const main = data.main ?? {};
    const sys = data.sys ?? {};
    const wind = data.wind ?? {};
    const timezoneOffset = toSafeNumber(data.timezone) ?? 0;

    const rawDescription = weather?.description || "Clear skies";
    const description = rawDescription.charAt(0).toUpperCase() + rawDescription.slice(1);
    const apiCityName = data.name || "Unknown";
    const iconUrl = buildIconUrl(weather?.icon);

    setText(cityTitle, apiCityName);
    setText(descriptionText, description);
    setText(temperatureText, formatTemperature(main.temp));
    setText(feelsLikeText, `Feels like ${formatTemperature(main.feels_like)}`);
    setText(updatedText, formatLastUpdated());

    setText(metricValues.temperature, formatTemperature(main.temp));
    setText(metricValues.feelsLike, formatTemperature(main.feels_like));
    setText(metricValues.humidity, formatHumidity(main.humidity));
    setText(metricValues.windSpeed, formatWindSpeed(wind.speed));
    setText(metricValues.pressure, formatPressure(main.pressure));
    setText(metricValues.visibility, formatVisibility(data.visibility));
    setText(metricValues.sunrise, formatLocalTime(sys.sunrise, timezoneOffset));
    setText(metricValues.sunset, formatLocalTime(sys.sunset, timezoneOffset));
    setText(metricValues.description, description);

    if (iconImage) {
      if (iconUrl) {
        iconImage.src = iconUrl;
        iconImage.alt = `${description} weather icon for ${apiCityName}`;
        iconImage.hidden = false;
        iconImage.onerror = () => {
          iconImage.hidden = true;
          iconImage.onerror = null;
        };
      } else {
        iconImage.removeAttribute("src");
        iconImage.alt = "";
        iconImage.hidden = true;
      }
    }
  };

  const showWeather = (data) => {
    clearFieldMsg();
    dismissToast();
    setButtonLoading(false);
    populateWeatherFields(data);
    setHidden(resultCard, false);

    const confirmedCity = normalizeCity(data.name);
    if (confirmedCity) {
      writeStorage(STORAGE_KEYS.lastCity, confirmedCity);
    }
  };

  const fetchWeatherByCity = async (cityName, controller) => {
    const requestUrl = new URL(API_BASE_URL);
    requestUrl.search = new URLSearchParams({
      q: cityName,
      appid: OPENWEATHER_API_KEY,
      units: "metric",
      lang: "en"
    }).toString();

    const response = await fetch(requestUrl, { signal: controller.signal });
    const responseText = await response.text();

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      const parseError = new Error("Invalid weather service response.");
      parseError.kind = "parse";
      throw parseError;
    }

    const statusCode = Number(data?.cod ?? response.status);

    if (!response.ok) {
      const error = new Error(String(data?.message ?? "Weather request failed."));
      error.status = response.status;
      if (statusCode === 401 || statusCode === 403) {
        error.kind = "auth";
      } else if (statusCode === 404) {
        error.kind = "not-found";
      } else {
        error.kind = "http";
      }
      throw error;
    }

    if (statusCode !== 200 || !data.main || !Array.isArray(data.weather)) {
      const error = new Error(String(data?.message ?? "Weather request failed."));
      error.kind = "unexpected";
      error.status = response.status;
      throw error;
    }

    return data;
  };

  const searchWeather = async (rawCityName) => {
    const cityName = normalizeCity(rawCityName);

    if (!cityName) {
      clearFieldMsg();
      showFieldMsg("Please enter a city to view the weather forecast.");
      return;
    }

    if (
      cityName.toLowerCase() === lastSearchedCity.toLowerCase() &&
      resultCard &&
      !resultCard.hidden
    ) {
      return;
    }

    const requestId = ++latestRequestId;
    lastSearchedCity = cityName;

    activeRequestController?.abort();
    const controller = new AbortController();
    activeRequestController = controller;

    clearFieldMsg();
    dismissToast();
    setButtonLoading(true);

    try {
      const weatherData = await fetchWeatherByCity(cityName, controller);

      if (requestId !== latestRequestId) return;

      showWeather(weatherData);
    } catch (error) {
      if (error?.name === "AbortError" || requestId !== latestRequestId) return;

      lastSearchedCity = "";
      setButtonLoading(false);

      if (error?.kind === "not-found") {
        showFieldMsg("We couldn't find that city. Check the spelling and try again.");
      } else {
        showToast("Unable to update weather. Please try again later.");
      }
    } finally {
      if (activeRequestController === controller) {
        activeRequestController = null;
      }
    }
  };

  resetWeatherState();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    searchWeather(input.value);
  });

  input.addEventListener("input", () => {
    input.classList.remove("is-invalid");
    if (fieldMsg) {
      fieldMsg.hidden = true;
      fieldMsg.textContent = "";
    }

    if (!input.value.trim()) {
      resetWeatherState();
      lastSearchedCity = "";
    }
  });

  recentButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const cityName = normalizeCity(button.dataset.city || button.textContent || "");
      if (!cityName) return;
      input.value = cityName;
      searchWeather(cityName);
    });
  });

  const lastCity = readStorage(STORAGE_KEYS.lastCity);
  if (lastCity) {
    input.value = lastCity;
    searchWeather(lastCity);
  }
};

initWeatherPage();
