import ReactGA from "react-ga4";

export const initAnalytics = () => {
  ReactGA.initialize("G-28MJWXKHVH");
};

export const trackPageView = (path) => {
  ReactGA.send({
    hitType: "pageview",
    page: path,
  });
};

export const trackEvent = (action, category, label) => {
  ReactGA.event({
    action,
    category,
    label,
  });
};