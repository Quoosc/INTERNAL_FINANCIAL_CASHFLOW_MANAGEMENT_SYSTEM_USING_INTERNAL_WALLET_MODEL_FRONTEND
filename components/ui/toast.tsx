"use client";

import React from "react";
import { ToastContainer } from "react-toastify";

export function ToastStack() {
  return (
    <ToastContainer
      position="top-center"
      theme="dark"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  );
}
