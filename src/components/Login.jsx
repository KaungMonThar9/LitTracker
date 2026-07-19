import axios from "axios";
import React from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    getEmailFromDatabase(data.email, data.password);
  };

  return (
    <>
      <h2 className="loginTitle">Login</h2>

      <form className="loginForm" onSubmit={handleSubmit(onSubmit)}>
        <input
          type="email"
          {...register("email", { required: true })}
          placeholder="Email"
        />
        {errors.email && (
          <span style={{ color: "red" }}>*Email* is mandatory</span>
        )}

        <input
          type="password"
          {...register("password", { required: true })}
          placeholder="Password"
        />
        {errors.password && (
          <span style={{ color: "red " }}>*Password* is required!</span>
        )}
        <input type="submit" style={{ backgroundColor: "#a1eafb" }} />
      </form>
      <p className="registerLink">
        Don&apos;t have an account? <Link to="/Register">Register</Link>
      </p>
    </>
  );
};

async function getEmailFromDatabase(email, password) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const payload = { email: email, password: password };
  await axios
    .post(`${apiUrl}/api/login-check`, payload)
    .then((response) => {
      alert(response.data);
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      console.log("Request completed");
    });
}

export default Login;
