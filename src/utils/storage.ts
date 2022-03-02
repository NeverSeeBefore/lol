type StorageType = "localStorage" | "sessionStorage";

export const storage = function (type: StorageType = "localStorage") {
  return {
    set: function (key: string, value: any) {
      if (typeof value === "object") {
        value = JSON.stringify(value);
      }
      window[type].setItem(key, value);
    },
    get: function (key: string) {
      const value = window[type].getItem(key) || "";

      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    },
    remove: function (key: string) {
      window[type].removeItem(key);
    },
  };
};
