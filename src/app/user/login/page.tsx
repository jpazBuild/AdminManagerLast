"use client";
import TextInputWithClearButton from "@/app/components/InputClear";
import imageStart from "../../../../public/automation_start.jpg";
import Image from "next/image";
import CardGlass from "../../components/cardGlass";
const LoginPage = () => {
    return (
        <div className="relative h-screen w-full flex flex-col justify-center items-center p-2">
            <Image
                src={imageStart}
                alt="Background Image"
                layout="fill"
                objectFit="cover"
                priority
                className="z-0"
            />

            <CardGlass className="min-w-[340px] max-w-[440px] flex flex-col items-center justify-center gap-4 z-10">
                <h2 className="text-2xl font-bold mb-6 text-center text-white">Login</h2>

                <TextInputWithClearButton
                    id="email"
                    type="email"
                    inputMode="text"
                    placeholder="Email"
                    className="max-w-[400px]"
                    onChangeHandler={(e) => console.log(e.target.value)}
                    value={""}
                />

                <TextInputWithClearButton
                    id="password"
                    type="password"
                    inputMode="text"
                    placeholder="Password"
                    className="max-w-[400px]"
                    onChangeHandler={(e) => console.log(e.target.value)}
                    value={""}
                />

                <button className="max-w-[400px] w-full cursor-pointer bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors">
                    Continue
                </button>


            </CardGlass>

            
            {/* <div className="absolute inset-0 bg-black/30 z-10"></div>

      <div className="relative z-20 flex items-center justify-center h-full px-4">
        <div className="flex flex-col gap-2 backdrop-blur-md bg-white/10 border border-white/20 shadow-lg rounded-lg w-full max-w-md p-8 text-white">
         
        </div>
      </div> */}
        </div>
    );
};

export default LoginPage;
