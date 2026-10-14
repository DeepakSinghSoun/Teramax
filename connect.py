from flask import Flask  , render_template , request
app=Flask(__name__)
@app.route("/", methods=["GET", "POST"])



def login():

    message=""

    if request.method =="POST":

        username=request.form.get("username")

        password=request.form.get("password")



        if username =='admin' and password=='123':

            message="success"

        else:

            message="L lle"

    return render_template("login.html" , message=message)


if __name__=="__main__":

    app.run(debug=True) 