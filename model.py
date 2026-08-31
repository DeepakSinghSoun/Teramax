"""Agents -> database"""
"""database -> functions"""
"""functions->model"""
"""model alert ->show alert in dashboard"""
"""model automate -> flag and fix sus devices"""

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score , classification_report
df = pd.read_csv("exampleDataset.csv")

x=df.drop(columns=["ipaddr","name","suspecious"])
y=df["suspecious"]


X_train , X_test , y_train , y_test = train_test_split(x,y,test_size=0.2 , random_state=42)


model=RandomForestClassifier(random_state=42 , class_weight="balanced")


model.fit(X_train , y_train)
y_predict=model.predict(X_test)

print(f"MODEL ACCURACY : {accuracy_score(y_test , y_predict)*100:.2f}% \n")
print(classification_report(y_test, y_predict))



test=[[False,False,False]]
prediction=model.predict(test)

print(prediction)

"""Model successfully created for 3 parameters which gives wether Y is suspecious or not

now i have to create a classes <very risky> <risky> <normal> to make model more reliable and successful

"""