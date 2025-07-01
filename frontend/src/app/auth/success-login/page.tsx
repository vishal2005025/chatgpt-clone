// 'use client'
// import { Loader } from "@/components/Loader";
// import { userAuthStore } from "@/store/authStore";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useEffect } from "react";




// export default function SuccessLogin () {
//     const router = useRouter() ;
//     const searchParams = useSearchParams();
//     const token = searchParams.get('token');

//     const {userProfile} = userAuthStore();

//     useEffect(() => {
//         if(token){
//             userProfile().then(() => {
//                 router.push('/')
//             })
//         }else{
//             router.push('/sign-in')
//         }
//     },[token,userProfile,router])


//     return(
//         <div className="flex h-screen items-center justify-center">
//             <Loader type="default" position="center"/>
//         </div>
//     )

// }



"use client";
import { Loader } from "@/components/Loader";
import { userAuthStore } from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SuccessLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { userProfile } = userAuthStore();

  useEffect(() => {
    const tryLogin = async (retries = 5, delay = 1000) => {
      if (!token) {
        router.push("/sign-in");
        return;
      }

      for (let i = 0; i < retries; i++) {
        try {
          await new Promise((res) => setTimeout(res, delay)); // wait for cookie
          await userProfile();
          router.push("/");
          return;
        } catch (err) {
          console.warn(`Retrying userProfile... (${i + 1}/${retries})`);
        }
      }

      // If all retries fail, go to sign-in
      router.push("/sign-in");
    };

    tryLogin();
  }, [token, userProfile, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader type="default" position="center" />
    </div>
  );
}
