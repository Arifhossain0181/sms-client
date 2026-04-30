import { loginSchema } from "@/src/lib/validtation";
import router from "next/dist/shared/lib/router/router";
import { Toast } from "radix-ui";



export  default function LoginForm() {

    const router = useRouter();
    const { setUser } = AuthStore();
    const {register ,hanglesubmit,formStateL{errors,isSubmitting}} = useForm<loginSchema>({
        resolver:zodResolver(loginSchema)});
}

const onsubmit= async(data:LoginSchema) =>{
    try{
        const user = await authService.login(data);
        setUser(user);
        Toast.success("Login successful");
        router.push("/dashboard");
    } catch (error) {
        Toast.error("Login failed");
    }
}
return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="email@example.com"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {isSubmitting ? "Loading..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Account নেই?{" "}
          <a href="/register" className="text-blue-600 hover:underline">Register</a>
        </p>
      </div>
    </div>
  );
