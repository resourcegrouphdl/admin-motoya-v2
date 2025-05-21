import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule,FormControlName, FormGroup, FormControl } from '@angular/forms';
import { AuthServiceService } from '../services/auth-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  loginForm: FormGroup;
   
  _loginService= inject(AuthServiceService)
  _routes = inject(Router)



  constructor(private fb:FormBuilder, ){

    this.loginForm = this.fb.group({
      email:[''],
      password:['']
    })

  }




  onSubmit(){
    this._loginService.userLoginForFirebase(this.loginForm.value.email,this.loginForm.value.password).subscribe({
      next: (userData) => {
        console.log(userData);
        this._routes.navigate(['/dashboard'])
      },
      error: (err) => {
        console.log(err);
      }
    })
  }
}
