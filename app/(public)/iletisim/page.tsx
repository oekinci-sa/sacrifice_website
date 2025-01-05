import ContactTitle from "./components/contact-title";
import Form from "@/app/(public)/iletisim/components/Form";
import FollowUs from "./components/follow-us";
import Info from "./components/info";

const page = () => {
  return (
    <div className="container flex space-x-32 items-end">
      <div className="flex flex-col space-y-12">
        <ContactTitle></ContactTitle>
        <FollowUs></FollowUs>
        <Info></Info>
      </div>
      <div className="w-1/2">
        <Form></Form>
      </div>
    </div>
  );
};

export default page;
