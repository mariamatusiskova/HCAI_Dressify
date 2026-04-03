import AuthPanel from "@/components/AuthPanel";

const ProfilePage = () => {
  return (
    <div className="p-4 md:p-6">
      <div className="max-w-md space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">Manage your account and authentication.</p>
        </div>
        <AuthPanel />
      </div>
    </div>
  );
};

export default ProfilePage;
