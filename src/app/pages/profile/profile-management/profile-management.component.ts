import { Component, OnInit } from "@angular/core";
import { NbAuthService, NbTokenService } from "@nebular/auth";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { UserService } from "../../../@core/data/users.service";
import { AuthService } from "../../../auth/auth.service";
import * as _ from "lodash";

@Component({
  selector: "ngx-profile-management",
  templateUrl: "./profile-management.component.html",
  styleUrls: ["./profile-management.component.scss"],
})
export class ProfileManagementComponent implements OnInit {
  user = {
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    phone: "",
    old_password: "",
    new_password: "",
    new_password_confirmation: "",
    two_factor_auth: false,
  };
  userId;
  successUserMessage;
  successPasswordMessage;
  clients;

  userForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    private userService: UserService,
    private authService: NbAuthService,
    private tokenService: NbTokenService,
    private localAuth: AuthService,
  ) {}

  ngOnInit() {
    this.createForm();
    this.loadUser();
  }

  checkPasswords(group: FormGroup) {
    // here we have the 'passwords' group
    const pass = group.get("newPassword").value;
    const confirmPass = group.get("newPasswordConfirmation").value;

    return pass === confirmPass ? null : { notSame: true };
  }

  createForm() {
    this.userForm = new FormGroup({
      name: new FormGroup({
        firstName: new FormControl("", Validators.required),
        lastName: new FormControl("", Validators.required),
      }),
      email: new FormControl("", [
        Validators.required,
        Validators.pattern("[^ @]*@[^ @]*"),
      ]),
      username: new FormControl("", [
        Validators.required,
        Validators.minLength(4),
      ]),
      phone: new FormControl("", [Validators.pattern("[0-9]{9}")]),
      two_factor_auth: new FormControl(false),
    });

    this.get("two_factor_auth").valueChanges.subscribe((checked) => {
      if (checked) {
        this.get("phone").setValidators([
          Validators.required,
          Validators.pattern("[0-9]{9}"),
        ]);
      } else {
        this.get("phone").setValidators([Validators.pattern("[0-9]{9}")]);
      }
      this.get("phone").updateValueAndValidity();
    });

    this.passwordForm = new FormGroup(
      {
        oldPassword: new FormControl("", Validators.required),
        newPassword: new FormControl("", [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-zd$@$!%*?&].{8,}",
          ),
        ]),
        newPasswordConfirmation: new FormControl(""),
      },
      { validators: this.checkPasswords },
    );
  }

  refreshToken() {
    this.tokenService.get().subscribe((curtoken) => {
      this.localAuth.refreshToken(curtoken.getPayload()).subscribe(
        (retval: any) => {
          const newtoken = retval.token;
          this.authService.refreshToken("email", newtoken);
          const token = JSON.parse(localStorage.getItem("auth_app_token"));
          token.value = newtoken;
          const tokenString = JSON.stringify(token);
          localStorage.setItem("auth_app_token", tokenString);
          this.loadUser();
        },
        (err) => {},
      );
    });
  }

  loadUser() {
    this.tokenService.get().subscribe((token) => {
      console.log(token);
      this.userId = token.getPayload()._id;
      console.log(token.getPayload());
      this.user = {
        ...this.user,
        ..._.pick(token.getPayload(), [
          "first_name",
          "last_name",
          "email",
          "username",
          "two_factor_auth",
          "phone",
        ]),
      };
    });
  }

  updateUserProfile() {
    const user = {
      first_name: this.get("name").get("firstName").value,
      last_name: this.get("name").get("lastName").value,
      username: this.get("username").value,
      email: this.get("email").value,
      two_factor_auth: this.get("two_factor_auth").value,
      phone: this.get("phone").value,
    };
    this.userService.updateUserProfile(user, this.userId).subscribe(
      (data) => {
        this.successUserMessage = data.message;
        this.refreshToken();
      },
      (err) => {
        const { error } = err;
        this.successUserMessage = "";
        this.userForm.setErrors({ message: error.message });
      },
    );
  }

  changePassword() {
    const password = {
      old_password: this.get_password("oldPassword").value,
      new_password: this.get_password("newPassword").value,
    };
    this.userService.changePassword(password, this.userId).subscribe(
      (data) => {
        this.successPasswordMessage = data.message;
        this.refreshToken();
      },
      (err) => {
        const { error } = err;
        this.successPasswordMessage = "";
        this.passwordForm.setErrors({ message: error.message });
      },
    );
  }

  // validator function
  get(controlName) {
    return this.userForm.get(controlName);
  }

  // validator function
  get_password(controlName) {
    return this.passwordForm.get(controlName);
  }
}
