class Toast{

    static show(message,type="info"){

        const toast=document.createElement("div");

        toast.className=`toast ${type}`;

        toast.innerHTML=message;

        document.body.appendChild(toast);

        requestAnimationFrame(()=>{

            toast.classList.add("show");

        });

        setTimeout(()=>{

            toast.classList.remove("show");

            setTimeout(()=>{

                toast.remove();

            },350);

        },3000);

    }

}

window.Toast=Toast;