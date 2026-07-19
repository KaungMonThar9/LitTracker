import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Register.css";

const Register = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const password = watch("password");
  const passwordRegex =
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

  const onSubmit = (data) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
    };
    axios
      .post(`${apiUrl}/api/signup`, payload)
      .then((response) => {
        alert(response.data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        console.log("Request completed");
      });
  };

  return (
    <>
      <h2>Registeration Form</h2>

      <form className="Register" onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text"
          {...register("name", { required: true })}
          placeholder="Name"
        />
        {errors.name && <span style={{ color: "red" }}>Name is mandatory</span>}

        <input
          type="email"
          {...register("email", { required: true })}
          placeholder="Email"
        />

        {errors.email && (
          <span style={{ color: "red" }}>Email is mandatory</span>
        )}

        <input
          type="password"
          {...register("password", {
            required: "Password is mandatory",
            pattern: {
              value: passwordRegex,
              message:
                "Password must be 8+ characters with uppercase, lowercase, number, and special character",
            },
          })}
          placeholder="Password"
        />

        {errors.password && (
          <span style={{ color: "red" }}>{errors.password.message}</span>
        )}

        <input
          type="password"
          {...register("confirmPassword", {
            required: true,
            validate: (value) => value === password || "Passwords do not match",
          })}
          placeholder="Confirm Password"
        />
        {errors.confirmPassword && (
          <span style={{ color: "red" }}>{errors.confirmPassword.message}</span>
        )}

        <input type="submit" style={{ backgroundColor: "#a1eafb" }} />
      </form>
      <p className="loginLink">
        Alreadd have an account? <Link to="/Login">Login</Link>
      </p>
    </>
  );
};

export default Register;
