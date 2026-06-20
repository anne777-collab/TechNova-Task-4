import { showToast } from "./main.js";

const rules = {
  name: {
    test: (value) => value.trim().length >= 2,
    message: "Please enter at least 2 characters."
  },
  email: {
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()),
    message: "Please enter a valid email address."
  },
  phone: {
    test: (value) => /^(\+91[\s-]?)?[6-9]\d{9}$/.test(value.replace(/\s/g, "")),
    message: "Please enter a valid Indian mobile number."
  },
  subject: {
    test: (value) => value.trim().length >= 4,
    message: "Please enter a clear subject."
  },
  message: {
    test: (value) => value.trim().length >= 12,
    message: "Please enter a message with at least 12 characters."
  }
};

const getErrorElement = (field) => {
  let error = field.parentElement.querySelector(".field-error");

  if (!error) {
    error = document.createElement("span");
    error.className = "field-error";
    error.id = `${field.id}-error`;
    field.insertAdjacentElement("afterend", error);
    field.setAttribute("aria-describedby", error.id);
  }

  return error;
};

const validateField = (field) => {
  const rule = rules[field.name];
  if (!rule) return true;

  const isValid = rule.test(field.value);
  const error = getErrorElement(field);

  field.classList.toggle("is-invalid", !isValid);
  field.classList.toggle("is-valid", isValid);
  field.setAttribute("aria-invalid", String(!isValid));
  error.textContent = isValid ? "" : rule.message;

  return isValid;
};

const initValidation = () => {
  const form = document.querySelector("[data-form='contact']");
  if (!form) return;

  const fields = [...form.querySelectorAll("input, textarea")];
  const message = form.querySelector("[data-form-message]");

  fields.forEach((field) => {
    field.addEventListener("input", () => validateField(field));
    field.addEventListener("blur", () => validateField(field));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const isValid = fields.map(validateField).every(Boolean);

    if (!isValid) {
      message.textContent = "Please fix the highlighted fields before submitting.";
      message.className = "form-message form-message--error";
      showToast("Please check the form fields", "error");
      return;
    }

    message.textContent = "Thanks! Your message has been prepared successfully.";
    message.className = "form-message form-message--success";
    showToast("Form submitted successfully", "success");
    form.reset();
    fields.forEach((field) => {
      field.classList.remove("is-valid", "is-invalid");
      field.removeAttribute("aria-invalid");
      const error = field.parentElement.querySelector(".field-error");
      if (error) error.textContent = "";
    });
  });
};

initValidation();
