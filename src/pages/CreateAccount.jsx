import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useMutation } from "@tanstack/react-query";

function CreateAccountHeader() {
  const navigate = useNavigate();
  return (
    <div
      data-layer="AppHeader"
      className="Appheader w-full border-b-[0.25px] border-slate-600 inline-flex flex-col justify-start items-start"
    >
      <div
        data-layer="PageLabelWrapper"
        className="Pagelabelwrapper self-stretch px-5 pt-10 pb-5 bg-stone-50 border-b-[0.25px] border-slate-600 flex flex-col justify-start items-start gap-2"
      >
        <div
          data-svg-wrapper
          data-layer="arrow-narrow-left"
          className="ArrowNarrowLeft relative cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.70703 14.707C7.5195 14.8945 7.26519 14.9998 7.00003 14.9998C6.73487 14.9998 6.48056 14.8945 6.29303 14.707L2.29303 10.707C2.10556 10.5195 2.00024 10.2652 2.00024 10C2.00024 9.73483 2.10556 9.48053 2.29303 9.293L6.29303 5.293C6.48163 5.11084 6.73424 5.01005 6.99643 5.01232C7.25863 5.0146 7.50944 5.11977 7.69485 5.30518C7.88026 5.49059 7.98543 5.7414 7.9877 6.0036C7.98998 6.26579 7.88919 6.5184 7.70703 6.707L5.41403 9H17C17.2652 9 17.5196 9.10536 17.7071 9.29289C17.8947 9.48043 18 9.73478 18 10C18 10.2652 17.8947 10.5196 17.7071 10.7071C17.5196 10.8946 17.2652 11 17 11H5.41403L7.70703 13.293C7.8945 13.4805 7.99982 13.7348 7.99982 14C7.99982 14.2652 7.8945 14.5195 7.70703 14.707Z"
              fill="#3F3F46"
            />
          </svg>
        </div>
        <div
          data-layer="HeadingSymbolWrapper"
          className="Headingsymbolwrapper self-stretch inline-flex justify-start items-center"
        >
          <div
            data-layer="Heading"
            className="Heading flex-1 justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose"
          >
            Swipe.fit
          </div>
        </div>
        <div
          data-layer="SubHeading"
          className="Subheading self-stretch justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal"
        >
          Create an account
        </div>
      </div>
    </div>
  );
}

export default function CreateAccount() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signupMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error("Signup error:", error);
    },
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    signupMutation.mutate({ email, password });
  };

  return (
    <div>
      {/* Why is this here? */}
      {/* <CreateAccountHeader /> */}
      <div className="w-full px-4 lg:w-1/3 mx-auto h-[782px] flex flex-col justify-center items-center">
        <div className="flex flex-col gap-4 w-full">
          <div className="justify-center text-slate-600 text-2xl font-normal font-['Space_Grotesk'] leading-9">
            Create account
          </div>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="create-account-email"
            className="bg-white h-[56px]"
            placeholder="Email"
            disabled={signupMutation.isPending}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            id="create-account-password"
            className="bg-white h-[56px]"
            placeholder="Password"
            disabled={signupMutation.isPending}
          />
          <Button
            type="submit"
            data-layer="Button"
            disabled={signupMutation.isPending}
            className="w-full h-[56px]"
            onClick={handleSignup}
          >
            {signupMutation.isPending
              ? "Creating Account..."
              : "Create Account"}
          </Button>
        </div>
        {signupMutation.isError && (
          <div style={{ color: "red", width: "100%" }}>
            {signupMutation.error.message}
          </div>
        )}
        {signupMutation.isSuccess && (
          <div style={{ color: "green", width: "100%" }}>
            Check your email to confirm your account.
          </div>
        )}
      </div>
    </div>
  );
}
