import Form from "@/app/(public)/iletisim/components/form";
import FollowUs from "./components/follow-us";
import Info from "./components/info";

const page = () => {
  return (
    <div className="container flex flex-col gap-8 lg:gap-12">
      <h1 className="text-2xl lg:text-3xl font-semibold text-center mt-6 lg:mt-12 mb-2 lg:mb-4">İletişim</h1>
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex flex-col gap-8 lg:gap-12">
          <Info />
          <FollowUs />
        </div>
        <Form />
      </div>
    </div>
  );
};

export default page;
