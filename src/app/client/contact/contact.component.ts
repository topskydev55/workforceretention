import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ContactService } from "../../@core/data/contact.service";


@Component({
    selector: 'ngx-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {

    email = { name: '', from_email: '', phone: '', organization: '', message: '' };
    contactForm: FormGroup;

    constructor(private contactService: ContactService) {
    }

    ngOnInit() {
        this.createForm();
    }

    // validator function
    get(controlName) {
        return this.contactForm.get(controlName);
    }

    createForm() {
        this.contactForm = new FormGroup({
            name: new FormControl('', [Validators.required]),
            email: new FormControl('', [
                Validators.required,
                Validators.pattern("[^ @]*@[^ @]*"),
            ]),
            phone: new FormControl(''),
            message: new FormControl('', [Validators.required]),
            organization: new FormControl('', [Validators.required]),
            recaptchaReactive: new FormControl(null, Validators.required),
        });
    }

    sendEmail() {
        if (!this.contactForm.valid) {
            alert('Invalid form data');
        } else {
            const param = {
                name: this.get('name').value,
                email: this.get('email').value,
                phone: this.get('phone').value,
                message: this.get('message').value,
                organization: this.get('organization').value,
            };

            this.contactService.sendEmail(param).subscribe(
                data => {
                    alert('The message was sent successfully.');
                },
                err => {
                    console.log(err);
                },
            );
        }
    }

}
